import { Button, Card, Form, Image, Input, message, Modal, Select, Switch } from "antd";
import { useContext, useEffect, useState } from "react";
import { useDeleteMarkerById } from "../../api/hooks/useDeleteMarkerById";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import { useUpsertMarkerById, type IUpsertMarkerById } from "../../api/hooks/useUpsertMarkerById";
import { TEMP_ID_FORMAT, TOOL } from "../../constant";
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
    const { handleDeleteMarkerById } = useDeleteMarkerById();
    const { modal, drawer, filterModal } = useContext(DrawerVisibilityContext);
    const [loadingDatasetInfoInput, setLoadingDatasetInfoInput] = useState(false);
    const [loadingGetDatasetInfoDisplay, setLoadingGetDatasetInfoDisplay] = useState(false);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [loadingGetDatasetInfoFetch, setLoadingGetDatasetInfoFetch] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (!modal.dataSet.value?.dataSetId) {
                return [];
            }

            setLoadingGetDatasetInfoFetch(true);
            const dataSetInfo = await handleGetDatasetInfo({
                getDatasetInfoId: modal.dataSet.value?.dataSetId,
            });

            const options =
                dataSetInfo.data?.get_dataset_info.datasets.map((data) => ({
                    value: String(data.id_primary),
                    label: String(data.id_primary),
                })) ?? [];

            setOptions(options);
            setLoadingGetDatasetInfoFetch(false);
        };

        fetch();
    }, [modal.dataSet.value?.dataSetId]);

    const fetchGetDatasetInfo = async (
        mounted: boolean,
        dataSetId: string | undefined,
        dataSetInfoId: string | undefined
    ) => {
        if (!(dataSetId && dataSetInfoId)) {
            return;
        }

        try {
            setLoadingGetDatasetInfoDisplay(true);

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
            if (mounted) setLoadingGetDatasetInfoDisplay(false);
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
        modalAntd.confirm({
            title: "Confirm Discard",
            content: (
                <>
                    <p>Are you sure you want to delete the marker?</p>
                    <p>This action cannot be undone.</p>
                </>
            ),
            onOk: async () => {
                if (modal.recentlyCreatedMarker.value) {
                    modal.dataSet.setValue(modal.originalDataSet.value);
                } else {
                    if (modal.dataSet.value?.id && modal.selectedArea.value?.id) {
                        await handleDeleteMarkerById({
                            floorId: modal.dataSet.value?.id,
                            id: modal.selectedArea.value?.id,
                        });

                        drawer.refetch.setValue((prev) => !prev);
                        modal.edit.setVisible(false);
                    }
                }
                modal.form.dataSetInfo.resetFields();
                modal.form.dataSet.resetFields();
                modal.dataSetInfo.setValue(null);
                modal.selectedArea.setValue(null);
            },
            okText: "YES",
        });
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
                modal.recentlyCreatedMarker.setValue(null);
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
            modal.recentlyCreatedMarker.setValue(null);
            setHighlightMarkers(modal.showAllMarks.visible);
        } catch (err) {
            messageApi.open({
                type: "error",
                content: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setLoadingDatasetInfoInput(false);
        }
    };

    const dataSetId = modal.form.dataSet.getFieldValue("dataSetInfoId"); // TEMPORARY ONLY

    return (
        <>
            {contextHolderModal}
            {contextHolderMessage}
            <Card
                styles={{
                    body: {
                        maxHeight: "calc(100vh - 17.625rem)",
                        overflowY: "auto",
                    },
                }}
                title="Stall Information"
                extra={
                    <div className="flex items-center gap-x-4">
                        <Switch
                            checked={modal.edit.visible}
                            onChange={(checked) => {
                                if (checked) {
                                    // Switching to Edit mode
                                    setHighlightMarkers(true);
                                    filterModal.dataSet.setValue(null);
                                    filterModal.form.resetFields();
                                    modal.edit.setVisible(checked);
                                } else {
                                    // Returning to View mode
                                    onCancel();
                                }
                            }}
                            disabled={
                                !modal.selectedFloorLevelId.value ||
                                !modal.selectedArea.value ||
                                !!modal.recentlyCreatedMarker.value
                            }
                            checkedChildren="Edit"
                            unCheckedChildren="View"
                        />
                        <CustomActionButtons
                            actions={["delete"]}
                            handleDelete={handleDelete}
                            disabledActions={modal.selectedArea.value ? [] : ["delete"]}
                        />
                    </div>
                }
                loading={loading || loadingGetDatasetInfoDisplay || loadingGetDatasetInfoFetch}
                actions={[
                    <div className="flex flex-col !px-6 !py-2 gap-2">
                        <Button
                            key="save"
                            type="primary"
                            onClick={() => {
                                modal.form.dataSet.submit();
                            }}
                            loading={loadingDatasetInfoInput}
                            disabled={
                                !modal.edit.visible &&
                                (modal.selectedTool.value === TOOL.SELECT ||
                                    !modal.selectedArea.value)
                            }
                        >
                            Save
                        </Button>
                        <Button
                            key="cancel"
                            onClick={onCancel}
                            disabled={
                                !modal.edit.visible &&
                                (modal.selectedTool.value === TOOL.SELECT ||
                                    !modal.selectedArea.value)
                            }
                        >
                            Cancel
                        </Button>
                    </div>,
                ]}
            >
                <Form
                    form={modal.form.dataSet}
                    layout="vertical"
                    autoComplete="off"
                    onFinish={onSave}
                >
                    <Form.Item
                        label="DATASET ID"
                        name="dataSetInfoId"
                        rules={[
                            {
                                required:
                                    modal.edit.visible ||
                                    (modal.selectedTool.value !== TOOL.SELECT &&
                                        !!modal.selectedArea.value),
                                message: "Dataset ID is required",
                            },
                        ]}
                    >
                        {!modal.selectedArea.value ||
                        modal.selectedTool.value === TOOL.MARKER ||
                        modal.edit.visible ? (
                            <Select
                                showSearch
                                placeholder="Search to Select"
                                options={options}
                                onChange={(e) => {
                                    onChange(e, "dataSetInfoId");
                                }}
                                disabled={
                                    !modal.edit.visible &&
                                    (modal.selectedTool.value === TOOL.SELECT ||
                                        !modal.selectedArea.value)
                                }
                                allowClear
                                optionFilterProp="label"
                            />
                        ) : (
                            <Input readOnly />
                        )}
                    </Form.Item>
                </Form>

                {modal.dataSetInfo.value && (
                    <Form form={modal.form.dataSetInfo} layout="vertical" autoComplete="off">
                        {Object.entries(modal.dataSetInfo.value || {})
                            .filter(([key]) => key !== "id_primary")
                            .map(([key, value]) => (
                                <Form.Item
                                    key={key}
                                    label={<span className="uppercase">{key}</span>}
                                    name={key}
                                >
                                    <Input value={String(value)} readOnly />
                                </Form.Item>
                            ))}
                        {/* TEMPORARY ONLY */}
                        <Form.Item
                            key={"image"}
                            label={<span className="uppercase">Image</span>}
                            name={"image"}
                        >
                            {
                                <div className="w-full h-72 overflow-hidden flex justify-center items-center">
                                    <Image
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center",
                                        }}
                                        src={`/stores/${
                                            dataSetId === "1"
                                                ? "chua-store.jpeg"
                                                : dataSetId === "2"
                                                ? "eden-store.png"
                                                : dataSetId === "3"
                                                ? "laidz-store.jpeg"
                                                : null
                                        }`}
                                        fallback="data:image/png;base64,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"
                                    />
                                </div>
                            }
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </>
    );
};
export default StallInformation;
