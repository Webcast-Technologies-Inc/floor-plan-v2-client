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
    const { floorPlanPage, drawer, filterModal } = useContext(DrawerVisibilityContext);
    const [loadingDatasetInfoInput, setLoadingDatasetInfoInput] = useState(false);
    const [loadingGetDatasetInfoDisplay, setLoadingGetDatasetInfoDisplay] = useState(false);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [loadingGetDatasetInfoFetch, setLoadingGetDatasetInfoFetch] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (!floorPlanPage.dataset.value?.dataSetId) {
                return [];
            }

            setLoadingGetDatasetInfoFetch(true);
            const dataSetInfo = await handleGetDatasetInfo({
                getDatasetInfoId: floorPlanPage.dataset.value?.dataSetId,
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
    }, [floorPlanPage.dataset.value?.dataSetId]);

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
                floorPlanPage.form.dataSetInfo.resetFields();
                floorPlanPage.stallInfoDataset.setValue(null);
                return;
            }

            // Step 3: Save info and update form fields
            if (!mounted) return;
            floorPlanPage.form.dataSetInfo.setFieldsValue(info);
            floorPlanPage.stallInfoDataset.setValue(info);
        } catch (err: any) {
            // Ignore AbortError which occurs when a previous request is cancelled by
            // the network layer (e.g. a subsequent query launched). This is not a
            // user-facing failure and pollutes logs/UI.
            const isAbort =
                err && (err.name === "AbortError" || /aborted/i.test(err.message ?? ""));
            floorPlanPage.form.dataSetInfo.resetFields();
            floorPlanPage.stallInfoDataset.setValue(null);
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
        let mounted = true; // To avoid error when adding a new floor while floorPlanPage.selectedMarker.value?.dataSetInfoId has a value
        fetchGetDatasetInfo(
            mounted,
            floorPlanPage.dataset.value?.dataSetId,
            floorPlanPage.selectedMarker.value?.dataSetInfoId
        );

        return () => {
            // mark as unmounted for in-flight promises
            mounted = false;
        };
    }, [floorPlanPage.dataset.value?.dataSetId, floorPlanPage.selectedMarker.value?.dataSetInfoId]);

    const onChange = (value: string, name: "dataSetInfoId") => {
        fetchGetDatasetInfo(true, floorPlanPage.dataset.value?.dataSetId, value);
        floorPlanPage.dataset.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((area) =>
                    area.id === floorPlanPage.selectedMarker.value?.id
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
                if (floorPlanPage.recentlyCreatedMarker.value) {
                    floorPlanPage.dataset.setValue(floorPlanPage.originalDataset.value);
                } else {
                    if (floorPlanPage.dataset.value?.id && floorPlanPage.selectedMarker.value?.id) {
                        await handleDeleteMarkerById({
                            floorId: floorPlanPage.dataset.value?.id,
                            id: floorPlanPage.selectedMarker.value?.id,
                        });

                        drawer.refetch.setValue((prev) => !prev);
                        floorPlanPage.edit.setVisible(false);
                    }
                }
                floorPlanPage.form.dataSetInfo.resetFields();
                floorPlanPage.form.dataSet.resetFields();
                floorPlanPage.stallInfoDataset.setValue(null);
                floorPlanPage.selectedMarker.setValue(null);
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
                floorPlanPage.dataset.setValue(floorPlanPage.originalDataset.value);
                floorPlanPage.edit.setVisible(false);
                floorPlanPage.selectedMarker.setValue(null);
                floorPlanPage.selectedTool.setValue(TOOL.SELECT);
                floorPlanPage.form.dataSet.resetFields();
                floorPlanPage.form.dataSetInfo.resetFields();
                floorPlanPage.stallInfoDataset.setValue(null);
                floorPlanPage.recentlyCreatedMarker.setValue(null);
                setHighlightMarkers(floorPlanPage.showAllMarks.visible);
            },
            okText: "YES",
        });
    };

    const onSave = async (values: { dataSetInfoId: string }) => {
        if (!floorPlanPage.dataset.value?.id) {
            return;
        }

        setLoadingDatasetInfoInput(true);

        try {
            const payload = {
                floorId: floorPlanPage.dataset.value?.id,
                ...floorPlanPage.selectedMarker.value,
                id: floorPlanPage.selectedMarker.value?.id?.startsWith(TEMP_ID_FORMAT)
                    ? undefined
                    : floorPlanPage.selectedMarker.value?.id,
                dataSetInfoId: values.dataSetInfoId,
            };

            await handleUpsertMarkerById(payload as IUpsertMarkerById);

            messageApi.open({
                type: "success",
                content: "Floor plan update successfully!",
            });

            drawer.refetch.setValue((prev) => !prev);
            floorPlanPage.form.dataSet.resetFields();
            floorPlanPage.selectedMarker.setValue(null);
            floorPlanPage.originalDataset.setValue(floorPlanPage.dataset.value);
            floorPlanPage.edit.setVisible(false);
            floorPlanPage.selectedTool.setValue(TOOL.SELECT);
            floorPlanPage.form.dataSetInfo.resetFields();
            floorPlanPage.stallInfoDataset.setValue(null);
            floorPlanPage.recentlyCreatedMarker.setValue(null);
            setHighlightMarkers(floorPlanPage.showAllMarks.visible);
        } catch (err) {
            messageApi.open({
                type: "error",
                content: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setLoadingDatasetInfoInput(false);
        }
    };

    const dataSetId = floorPlanPage.form.dataSet.getFieldValue("dataSetInfoId"); // TEMPORARY ONLY

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
                            checked={floorPlanPage.edit.visible}
                            onChange={(checked) => {
                                if (checked) {
                                    // Switching to Edit mode
                                    setHighlightMarkers(true);
                                    filterModal.dataSet.setValue(null);
                                    filterModal.form.resetFields();
                                    floorPlanPage.edit.setVisible(checked);
                                } else {
                                    // Returning to View mode
                                    onCancel();
                                }
                            }}
                            disabled={
                                !floorPlanPage.selectedFloorLevelId.value ||
                                !floorPlanPage.selectedMarker.value ||
                                !!floorPlanPage.recentlyCreatedMarker.value
                            }
                            checkedChildren="Edit"
                            unCheckedChildren="View"
                        />
                        <CustomActionButtons
                            actions={["delete"]}
                            handleDelete={handleDelete}
                            disabledActions={floorPlanPage.selectedMarker.value ? [] : ["delete"]}
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
                                floorPlanPage.form.dataSet.submit();
                            }}
                            loading={loadingDatasetInfoInput}
                            disabled={
                                !floorPlanPage.edit.visible &&
                                (floorPlanPage.selectedTool.value === TOOL.SELECT ||
                                    !floorPlanPage.selectedMarker.value)
                            }
                        >
                            Save
                        </Button>
                        <Button
                            key="cancel"
                            onClick={onCancel}
                            disabled={
                                !floorPlanPage.edit.visible &&
                                (floorPlanPage.selectedTool.value === TOOL.SELECT ||
                                    !floorPlanPage.selectedMarker.value)
                            }
                        >
                            Cancel
                        </Button>
                    </div>,
                ]}
            >
                <Form
                    form={floorPlanPage.form.dataSet}
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
                                    floorPlanPage.edit.visible ||
                                    (floorPlanPage.selectedTool.value !== TOOL.SELECT &&
                                        !!floorPlanPage.selectedMarker.value),
                                message: "Dataset ID is required",
                            },
                        ]}
                    >
                        {!floorPlanPage.selectedMarker.value ||
                        floorPlanPage.selectedTool.value === TOOL.MARKER ||
                        floorPlanPage.edit.visible ? (
                            <Select
                                showSearch
                                placeholder="Search to Select"
                                options={options}
                                onChange={(e) => {
                                    onChange(e, "dataSetInfoId");
                                }}
                                disabled={
                                    !floorPlanPage.edit.visible &&
                                    (floorPlanPage.selectedTool.value === TOOL.SELECT ||
                                        !floorPlanPage.selectedMarker.value)
                                }
                                allowClear
                                optionFilterProp="label"
                            />
                        ) : (
                            <Input readOnly />
                        )}
                    </Form.Item>
                </Form>

                {floorPlanPage.stallInfoDataset.value && (
                    <Form
                        form={floorPlanPage.form.dataSetInfo}
                        layout="vertical"
                        autoComplete="off"
                    >
                        {Object.entries(floorPlanPage.stallInfoDataset.value || {})
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
