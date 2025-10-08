import { Button, Card, Radio } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import CustomActionButtons from "../../CustomActionButtons";

const options: CheckboxGroupProps<string>["options"] = [
    { label: "Select", value: "select" },
    { label: "Marker", value: "marker" },
];

const FloorPlandEditor = () => {
    return (
        <Card
            title="Amy's Store"
            variant="outlined"
            style={{ width: "100%" }}
            extra={
                <div className="flex items-center gap-x-8">
                    <Radio.Group
                        block
                        options={options}
                        defaultValue="select"
                        optionType="button"
                        buttonStyle="solid"
                    />
                    <div className="!space-x-2">
                        <Button onClick={() => {}}>Cancel</Button>
                        <Button type="primary" onClick={() => {}} loading={false}>
                            Save
                        </Button>
                    </div>
                    <CustomActionButtons
                        actions={["edit"]}
                        // handleDelete={handleDelete}
                    />
                </div>
            }
        >
            <p>Card content</p>
            <p>Card content</p>
            <p>Card content</p>
        </Card>
    );
};
export default FloorPlandEditor;
