import { InboxOutlined } from "@ant-design/icons";
import { type UploadProps } from "antd";
import Dragger from "antd/es/upload/Dragger";

const FloorPlanUploader = () => {
    const props: UploadProps = {
        name: "file",
        multiple: true,
        action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
        onChange(info) {
            const { status } = info.file;
            if (status !== "uploading") {
                console.log(info.file, info.fileList);
            }
            if (status === "done") {
                //   message.success(`${info.file.name} file uploaded successfully.`);
            } else if (status === "error") {
                //   message.error(`${info.file.name} file upload failed.`);
            }
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
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
