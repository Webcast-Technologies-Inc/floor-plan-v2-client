import { Card, Form, Input } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useContext } from "react";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = () => {
    const { modal } = useContext(DrawerVisibilityContext);

    const onChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: "name" | "description"
    ) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                floorPlans: {
                    ...prev.floorPlans,
                    floorPlanAreas: prev.floorPlans?.floorPlanAreas?.map((area) =>
                        area.id === modal.selectedArea.value?.id
                            ? {
                                  ...area,
                                  details: {
                                      ...area.details,
                                      [name]: e.target.value ?? "",
                                  },
                              }
                            : area
                    ) as IFloorPlanArea[],
                },
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
                    floorPlans: {
                        ...prev.floorPlans,
                        floorPlanAreas: prev.floorPlans?.floorPlanAreas?.filter(
                            (area) => area.id !== modal.selectedArea.value?.id
                        ) as IFloorPlanArea[],
                    },
                };
            });
        }
    };

    return (
        <Card
            title="Details"
            extra={<CustomActionButtons actions={["delete"]} handleDelete={handleDelete} />}
        >
            <Form form={modal.form} layout="vertical" autoComplete="off">
                <Form.Item label="Name" name="name">
                    <Input
                        onChange={(e) => {
                            onChange(e, "name");
                        }}
                        // readOnly={
                        //     !modal.edit.visible || !modal.selectedArea.value
                        // }
                        allowClear
                    />
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <TextArea
                        rows={3}
                        onChange={(e) => {
                            onChange(e, "description");
                        }}
                        // readOnly={
                        //     !modal.edit.visible || !modal.selectedArea.value
                        // }
                        allowClear
                    />
                </Form.Item>
            </Form>
        </Card>
    );
};
export default AreaDetails;
