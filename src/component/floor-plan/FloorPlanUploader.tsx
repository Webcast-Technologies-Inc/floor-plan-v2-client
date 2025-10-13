import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload, type UploadProps } from "antd";

interface FloorPlanUploaderProps {
    onFileUpload: (file: File) => void;
}

const FloorPlanUploader = ({ onFileUpload }: FloorPlanUploaderProps) => {
    const props: UploadProps = {
        name: "file",
        multiple: false,
        beforeUpload: (file) => {
            onFileUpload(file);

            return false;
        },
        showUploadList: false,
    };

    return (
        <Upload {...props}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
    );
};
export default FloorPlanUploader;
