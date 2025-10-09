import { type UploadFile } from "antd/es/upload/interface";
import moment from "moment";

const customFileName = (file: UploadFile) => {
    const dateTimeId = moment().format("YYYYMMDD_HHmmss_SSS");
    const fileName = file.name.replace(/ /g, "_");
    const customFileName = `${dateTimeId}-${fileName.replace(/%/g, "%25")}`;
    return customFileName;
};

export default customFileName;
