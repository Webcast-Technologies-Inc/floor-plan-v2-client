import { Button, Card, Empty, Form, message, Modal, Select, Spin } from "antd";
import { useContext, useState } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import { useUpsertMarkerById, type IUpsertMarkerById } from "../../api/hooks/useUpsertMarkerById";
import { TEMP_ID_FORMAT, TOOL } from "../../constant";
import useInfiniteScrollSelect from "../../hook/useInfiniteScrollSelect";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = ({
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
    const { floorPlanModal, drawer } = useContext(DrawerVisibilityContext);
    const {
        options,
        loading: isSelectLoading,
        typing,
        handleScroll,
        setSearchInput,
    } = useInfiniteScrollSelect(mockFetch, 30);
    const [loadingSave, setLoadingSave] = useState(false);

    async function mockFetch(
        page: number,
        pageSize: number,
        search?: string
    ): Promise<{ label: string; value: string }[]> {
        if (!floorPlanModal.dataSet.value?.dataSetId) {
            return [];
        }

        const dataSetInfo = await handleGetDatasetInfo({
            getDatasetInfoId: floorPlanModal.dataSet.value?.dataSetId,
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

    const onChange = (value: string, name: "dataSetInfoId") => {
        floorPlanModal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((area) =>
                    area.id === floorPlanModal.selectedArea.value?.id
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
        if (floorPlanModal.edit.visible) {
            modalAntd.confirm({
                title: "Confirm Discard",
                content: (
                    <>
                        <p>Are you sure you want to delete the marker?</p>
                        <p>This action cannot be undone.</p>
                    </>
                ),
                onOk: () => {
                    floorPlanModal.form.dataSet.resetFields();
                    floorPlanModal.selectedArea.setValue(null);

                    floorPlanModal.dataSet.setValue((prev) => {
                        if (!prev) return prev;

                        return {
                            ...prev,
                            areas: prev.areas?.filter(
                                (area) => area.id !== floorPlanModal.selectedArea.value?.id
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
                floorPlanModal.dataSet.setValue(floorPlanModal.originalDataSet.value);
                floorPlanModal.edit.setVisible(false);
                floorPlanModal.selectedArea.setValue(null);
                floorPlanModal.selectedTool.setValue(TOOL.SELECT);
                floorPlanModal.form.dataSet.resetFields();
                floorPlanModal.form.dataSetInfo.resetFields();
                floorPlanModal.dataSetInfo.setValue(null);
                setHighlightMarkers(floorPlanModal.showAllMarks.visible);
            },
            okText: "YES",
        });
    };

    const onSave = async (values: { dataSetInfoId: string }) => {
        if (!floorPlanModal.dataSet.value?.id) {
            return;
        }

        setLoadingSave(true);

        try {
            const payload = {
                floorId: floorPlanModal.dataSet.value?.id,
                ...floorPlanModal.selectedArea.value,
                id: floorPlanModal.selectedArea.value?.id?.startsWith(TEMP_ID_FORMAT)
                    ? undefined
                    : floorPlanModal.selectedArea.value?.id,
                dataSetInfoId: values.dataSetInfoId,
            };

            await handleUpsertMarkerById(payload as IUpsertMarkerById);

            messageApi.open({
                type: "success",
                content: "Floor plan update successfully!",
            });

            drawer.refetch.setValue((prev) => !prev);
            floorPlanModal.form.dataSet.resetFields();
            floorPlanModal.selectedArea.setValue(null);
            floorPlanModal.originalDataSet.setValue(floorPlanModal.dataSet.value);
            floorPlanModal.edit.setVisible(false);
            floorPlanModal.selectedTool.setValue(TOOL.SELECT);
            floorPlanModal.form.dataSetInfo.resetFields();
            floorPlanModal.dataSetInfo.setValue(null);
            setHighlightMarkers(floorPlanModal.showAllMarks.visible);
        } catch (err) {
            messageApi.open({
                type: "error",
                content: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setLoadingSave(false);
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
                title="Dataset Details"
                extra={
                    <CustomActionButtons
                        actions={
                            floorPlanModal.edit.visible && floorPlanModal.selectedArea.value
                                ? ["delete"]
                                : []
                        }
                        handleDelete={handleDelete}
                    />
                }
                loading={loading}
                actions={
                    floorPlanModal.edit.visible && floorPlanModal.selectedFloorLevelId.value
                        ? [
                              <div className="flex flex-col !px-6 !py-2 gap-2">
                                  <Button
                                      key="save"
                                      type="primary"
                                      onClick={() => {
                                          floorPlanModal.form.dataSet.submit();
                                      }}
                                      loading={loadingSave}
                                      disabled={
                                          !floorPlanModal.edit.visible ||
                                          !floorPlanModal.selectedArea.value
                                      }
                                  >
                                      Save
                                  </Button>
                                  <Button
                                      key="cancel"
                                      onClick={onCancel}
                                      disabled={
                                          !floorPlanModal.edit.visible ||
                                          !floorPlanModal.selectedArea.value
                                      }
                                  >
                                      Cancel
                                  </Button>
                              </div>,
                          ]
                        : undefined
                }
            >
                <Form
                    form={floorPlanModal.form.dataSet}
                    layout="vertical"
                    autoComplete="off"
                    onFinish={onSave}
                >
                    <Form.Item
                        label="Stall Information Id"
                        name="dataSetInfoId"
                        rules={[
                            {
                                required: true,
                                message: "Stall Information Id is required",
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
                            disabled={
                                !floorPlanModal.edit.visible || !floorPlanModal.selectedArea.value
                            }
                            allowClear
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};
export default AreaDetails;
