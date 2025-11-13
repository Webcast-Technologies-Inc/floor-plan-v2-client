import { Button, Card, Empty, Form, Input, message, Modal, Select, Spin, Switch } from "antd";
import { useContext, useEffect, useState } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import { useUpsertMarkerById, type IUpsertMarkerById } from "../../api/hooks/useUpsertMarkerById";
import { TEMP_ID_FORMAT, TOOL } from "../../constant";
import useInfiniteScrollSelect from "../../hook/useInfiniteScrollSelect";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const StallInformation = ({
    loading,
    setHighlightMarkers,
}: {
    loading: boolean;
    setHighlightMarkers: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { handleUpsertMarkerById } = useUpsertMarkerById();
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const { modal, drawer, filterModal } = useContext(DrawerVisibilityContext);
    const {
        options,
        loading: isSelectLoading,
        typing,
        handleScroll,
        setSearchInput,
        resetInfiniteScrollStates,
    } = useInfiniteScrollSelect(mockFetch, 30);
    const [loadingDatasetInfoInput, setLoadingDatasetInfoInput] = useState(false);
    const [loadingDatasetInfoDisplay, setLoadingDatasetInfoDisplay] = useState(false);

    async function mockFetch(
        page: number,
        pageSize: number,
        search?: string
    ): Promise<{ label: string; value: string }[]> {
        if (!modal.dataSet.value?.dataSetId) {
            return [];
        }

        const dataSetInfo = await handleGetDatasetInfo({
            getDatasetInfoId: modal.dataSet.value?.dataSetId,
            args: {
                offset: (page - 1) * pageSize,
                limit: pageSize,
                ...(search
                    ? {
                          orMatch: [
                              {
                                  field: "id_primary",
                                  value: search,
                              },
                          ],
                      }
                    : {}),
            },
        });

        const options =
            dataSetInfo.data?.get_dataset_info.datasets.map((data) => ({
                value: String(data.id_primary),
                label: String(data.id_primary),
            })) ?? [];

        return options;
    }

    useEffect(() => {
        if (modal.edit.visible) {
            setSearchInput(modal.form.dataSet.getFieldValue("dataSetInfoId"));
        }
        return () => resetInfiniteScrollStates();
    }, [modal.edit.visible]);

    const fetchGetDatasetInfo = async (
        mounted: boolean,
        dataSetId: string | undefined,
        dataSetInfoId: string | undefined
    ) => {
        if (!(dataSetId && dataSetInfoId)) {
            return;
        }

        try {
            setLoadingDatasetInfoDisplay(true);

            const dataSetInfo = await handleGetDatasetInfo({
                getDatasetInfoId: dataSetId,
                args: {
                    andConditions: [
                        {
                            field: "id_primary",
                            values: dataSetInfoId,
                        },
                    ],
                },
            });

            const info = dataSetInfo.data?.get_dataset_info.datasets?.[0];

            if (!info) {
                if (!mounted) return;
                messageApi.open({
                    type: "info",
                    content: "Dataset info does not exist!",
                });
                modal.form.dataSetInfo.resetFields();
                modal.dataSetInfo.setValue(null);
                return;
            }

            // Step 3: Save info and update form fields
            if (!mounted) return;
            modal.form.dataSetInfo.setFieldsValue(info);
            modal.dataSetInfo.setValue(info);
        } catch (err: any) {
            // Ignore AbortError which occurs when a previous request is cancelled by
            // the network layer (e.g. a subsequent query launched). This is not a
            // user-facing failure and pollutes logs/UI.
            const isAbort =
                err && (err.name === "AbortError" || /aborted/i.test(err.message ?? ""));
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);
            if (!isAbort) {
                messageApi.open({
                    type: "error",
                    content: "Failed to get dataset info!",
                });
            }
        } finally {
            if (mounted) setLoadingDatasetInfoDisplay(false);
        }
    };

    useEffect(() => {
        let mounted = true; // To avoid error when adding a new floor while modal.selectedArea.value?.dataSetInfoId has a value
        fetchGetDatasetInfo(
            mounted,
            modal.dataSet.value?.dataSetId,
            modal.selectedArea.value?.dataSetInfoId
        );

        return () => {
            // mark as unmounted for in-flight promises
            mounted = false;
        };
    }, [modal.dataSet.value?.dataSetId, modal.selectedArea.value?.dataSetInfoId]);

    const onChange = (value: string, name: "dataSetInfoId") => {
        fetchGetDatasetInfo(true, modal.dataSet.value?.dataSetId, value);
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((area) =>
                    area.id === modal.selectedArea.value?.id
                        ? {
                              ...area,
                              [name]: value ?? "",
                          }
                        : area
                ) as IFloorPlanArea[],
            };
        });
    };

    const handleDelete = () => {
        if (modal.edit.visible) {
            modalAntd.confirm({
                title: "Confirm Discard",
                content: (
                    <>
                        <p>Are you sure you want to delete the marker?</p>
                        <p>This action cannot be undone.</p>
                    </>
                ),
                onOk: () => {
                    modal.form.dataSet.resetFields();
                    modal.selectedArea.setValue(null);

                    modal.dataSet.setValue((prev) => {
                        if (!prev) return prev;

                        return {
                            ...prev,
                            areas: prev.areas?.filter(
                                (area) => area.id !== modal.selectedArea.value?.id
                            ) as IFloorPlanArea[],
                        };
                    });
                },
                okText: "YES",
            });
        }
    };

    const onCancel = () => {
        modalAntd.confirm({
            title: "Confirm Discard",
            content: (
                <>
                    <p>Are you sure you want to discard changes?</p>
                    <p>This action cannot be undone.</p>
                </>
            ),
            onOk: () => {
                modal.dataSet.setValue(modal.originalDataSet.value);
                modal.edit.setVisible(false);
                modal.selectedArea.setValue(null);
                modal.selectedTool.setValue(TOOL.SELECT);
                modal.form.dataSet.resetFields();
                modal.form.dataSetInfo.resetFields();
                modal.dataSetInfo.setValue(null);
                setHighlightMarkers(modal.showAllMarks.visible);
            },
            okText: "YES",
        });
    };

    const onSave = async (values: { dataSetInfoId: string }) => {
        if (!modal.dataSet.value?.id) {
            return;
        }

        setLoadingDatasetInfoInput(true);

        try {
            const payload = {
                floorId: modal.dataSet.value?.id,
                ...modal.selectedArea.value,
                id: modal.selectedArea.value?.id?.startsWith(TEMP_ID_FORMAT)
                    ? undefined
                    : modal.selectedArea.value?.id,
                dataSetInfoId: values.dataSetInfoId,
            };

            await handleUpsertMarkerById(payload as IUpsertMarkerById);

            messageApi.open({
                type: "success",
                content: "Floor plan update successfully!",
            });

            drawer.refetch.setValue((prev) => !prev);
            modal.form.dataSet.resetFields();
            modal.selectedArea.setValue(null);
            modal.originalDataSet.setValue(modal.dataSet.value);
            modal.edit.setVisible(false);
            modal.selectedTool.setValue(TOOL.SELECT);
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);
            setHighlightMarkers(modal.showAllMarks.visible);
            resetInfiniteScrollStates();
        } catch (err) {
            messageApi.open({
                type: "error",
                content: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setLoadingDatasetInfoInput(false);
        }
    };

    const renderSpinner = (
        <div style={{ textAlign: "center", padding: 8 }}>
            <Spin size="small" />
        </div>
    );

    return (
        <>
            {contextHolderModal}
            {contextHolderMessage}
            <Card
                styles={{
                    body: {
                        maxHeight: "calc(100vh - 314px)",
                        overflowY: "auto",
                    },
                }}
                title="Stall Information"
                extra={
                    <div className="flex items-center gap-x-4">
                        <Switch
                            checked={modal.edit.visible}
                            onChange={(checked) => {
                                modal.edit.setVisible(checked);
                                setHighlightMarkers(checked);

                                if (checked) {
                                    filterModal.dataSet.setValue(null);
                                    filterModal.form.resetFields();
                                } else {
                                    // Returning to View mode
                                    modal.dataSet.setValue(modal.originalDataSet.value);
                                }
                            }}
                            disabled={
                                !modal.selectedFloorLevelId.value || !modal.selectedArea.value
                            }
                            checkedChildren="Edit"
                            unCheckedChildren="View"
                        />
                        <CustomActionButtons
                            actions={["delete"]}
                            handleDelete={handleDelete}
                            disabledActions={
                                modal.edit.visible && modal.selectedArea.value ? [] : ["delete"]
                            }
                        />
                    </div>
                }
                loading={loading || loadingDatasetInfoDisplay}
                actions={[
                    <div className="flex flex-col !px-6 !py-2 gap-2">
                        <Button
                            key="save"
                            type="primary"
                            onClick={() => {
                                modal.form.dataSet.submit();
                            }}
                            loading={loadingDatasetInfoInput}
                            disabled={!modal.edit.visible || !modal.selectedArea.value}
                        >
                            Save
                        </Button>
                        <Button
                            key="cancel"
                            onClick={onCancel}
                            disabled={!modal.edit.visible || !modal.selectedArea.value}
                        >
                            Cancel
                        </Button>
                    </div>,
                ]}
            >
                {modal.edit.visible && (
                    <Form
                        form={modal.form.dataSet}
                        layout="vertical"
                        autoComplete="off"
                        onFinish={onSave}
                    >
                        <Form.Item
                            label="Dataset Id"
                            name="dataSetInfoId"
                            rules={[
                                {
                                    required: true,
                                    message: "Dataset Id is required",
                                },
                            ]}
                        >
                            <Select
                                showSearch
                                placeholder="Search to Select"
                                options={options}
                                onChange={(e) => {
                                    onChange(e, "dataSetInfoId");
                                }}
                                onSearch={(value) => {
                                    setSearchInput(value); // triggers debounce
                                }}
                                onPopupScroll={handleScroll}
                                popupRender={(menu) => {
                                    if (typing) {
                                        return renderSpinner;
                                    }

                                    return (
                                        <>
                                            {menu}
                                            {isSelectLoading && renderSpinner}
                                        </>
                                    );
                                }}
                                notFoundContent={
                                    typing ? (
                                        <div style={{ textAlign: "center", padding: 8 }}>
                                            <Spin size="small" />
                                        </div>
                                    ) : (
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )
                                }
                                disabled={!modal.edit.visible || !modal.selectedArea.value}
                                allowClear
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Form>
                )}

                {modal.dataSetInfo.value ? (
                    <Form form={modal.form.dataSetInfo} layout="vertical" autoComplete="off">
                        {Object.entries(modal.dataSetInfo.value || {})
                            .filter(([key]) => !modal.edit.visible || key !== "id_primary")
                            .map(([key, value]) => (
                                <Form.Item key={key} label={key} name={key}>
                                    <Input value={String(value)} readOnly />
                                </Form.Item>
                            ))}
                    </Form>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Card>
        </>
    );
};
export default StallInformation;
