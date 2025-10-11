import { Card, Form, Input } from "antd";
import TextArea from "antd/es/input/TextArea";
import CustomActionButtons from "../CustomActionButtons";

const AreaDetails = () => {
    const [form] = Form.useForm();

    return (
        <Card
            title="Details"
            extra={
                <CustomActionButtons
                    actions={["delete"]}
                    // handleDelete={handleDelete}
                />
            }
        >
            <Form form={form} layout="vertical" autoComplete="off">
                <Form.Item label="Name" name="name">
                    <Input
                        onChange={(e) => {
                            // onChange(e, "name", modal);
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
                        // onChange={(e) => {
                        //     onChange(e, "description", modal);
                        // }}
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
