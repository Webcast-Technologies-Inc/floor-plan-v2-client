import { Button, Card, Empty, Form, message, Modal, Select, Spin } from "antd";
import { useContext, useState } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import { useUpsertMarkerById, type IUpsertMarkerById } from "../../api/hooks/useUpsertMarkerById";
import { TEMP_ID_FORMAT } from "../../constant";
import useInfiniteScrollSelect from "../../hook/useInfiniteScrollSelect";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = ({
    loading,
    setHighlightMarkers,
}: {
    loading: boolean;
    highlightMarkers: boolean;
    setHighlightMarkers: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { handleUpsertMarkerById } = useUpsertMarkerById();
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const { modal, drawer } = useContext(DrawerVisibilityContext);
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

    const onChange = (value: string, name: "dataSetInfoId") => {
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
                modal.selectedTool.setValue("select");
                modal.form.dataSet.resetFields();
                setHighlightMarkers(modal.showAllMarks.visible);
            },
            okText: "YES",
        });
    };

    const onSave = async (values: { dataSetInfoId: string }) => {
        if (!modal.dataSet.value?.id) {
            return;
        }

        setLoadingSave(true);

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
            modal.selectedTool.setValue("select");
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);
            setHighlightMarkers(modal.showAllMarks.visible);
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
                        actions={modal.edit.visible && modal.selectedArea.value ? ["delete"] : []}
                        handleDelete={handleDelete}
                    />
                }
                loading={loading}
                actions={
                    modal.edit.visible && modal.selectedFloorLevelId.value
                        ? [
                              <div className="flex flex-col !px-6 !py-2 gap-2">
                                  <Button
                                      key="save"
                                      type="primary"
                                      onClick={() => {
                                          modal.form.dataSet.submit();
                                      }}
                                      loading={loadingSave}
                                  >
                                      Save
                                  </Button>
                                  <Button key="cancel" onClick={onCancel}>
                                      Cancel
                                  </Button>
                              </div>,
                          ]
                        : undefined
                }
            >
                <Form
                    form={modal.form.dataSet}
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
                            disabled={!modal.edit.visible || !modal.selectedArea.value}
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
