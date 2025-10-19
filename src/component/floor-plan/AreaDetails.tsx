import { Card, Form, Input } from "antd";
import { useContext } from "react";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = ({ loading }: { loading: boolean }) => {
    const { modal } = useContext(DrawerVisibilityContext);

    const onChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: "dataSetInfoId"
    ) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((area) =>
                    area.id === modal.selectedArea.value?.id
                        ? {
                              ...area,
                              [name]: e.target.value ?? "",
                          }
                        : area
                ) as IFloorPlanArea[],
            };
        });
    };

    const handleDelete = () => {
        if (modal.edit.visible) {
            modal.form.resetFields();
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
            <Form form={modal.form} layout="vertical" autoComplete="off">
                <Form.Item label="Dataset Information Id" name="dataSetInfoId">
                    <Input
                        onChange={(e) => {
                            onChange(e, "dataSetInfoId");
                        }}
                        readOnly={!modal.edit.visible || !modal.selectedArea.value}
                        allowClear
                    />
                </Form.Item>
            </Form>
        </Card>
    );
};
export default AreaDetails;
