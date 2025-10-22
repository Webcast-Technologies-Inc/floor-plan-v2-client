import { Card, Empty, Form, Select, Spin } from "antd";
import { useContext } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import useInfiniteScrollSelect from "../../hook/useInfiniteScrollSelect";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = ({ loading }: { loading: boolean }) => {
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const { modal } = useContext(DrawerVisibilityContext);
    const {
        options,
        loading: isSelectLoading,
        typing,
        handleScroll,
        setSearchInput,
    } = useInfiniteScrollSelect(mockFetch, 30);

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
        }
    };

    return (
        <Card
            title="Dataset Details"
            extra={
                <CustomActionButtons
                    actions={modal.edit.visible && modal.selectedArea.value ? ["delete"] : []}
                    handleDelete={handleDelete}
                />
            }
            loading={loading}
        >
            <Form form={modal.form.dataSet} layout="vertical" autoComplete="off">
                <Form.Item label="Dataset Information Id" name="dataSetInfoId">
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
                        popupRender={(menu) => (
                            <>
                                {menu}
                                {!typing && isSelectLoading && (
                                    <div style={{ textAlign: "center", padding: 8 }}>
                                        <Spin size="small" />
                                    </div>
                                )}
                            </>
                        )}
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
    );
};
export default AreaDetails;
