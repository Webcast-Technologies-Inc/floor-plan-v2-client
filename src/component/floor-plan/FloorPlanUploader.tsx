import { InboxOutlined } from "@ant-design/icons";
import { type UploadProps } from "antd";
import Dragger from "antd/es/upload/Dragger";

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
    };

    return (
        <Dragger {...props}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">
                Drag and drop your floor plan image or PDF here or click to browse
            </p>
            <p className="ant-upload-hint">Supports: JPG, PNG, PDF</p>
        </Dragger>
    );
};
export default FloorPlanUploader;
