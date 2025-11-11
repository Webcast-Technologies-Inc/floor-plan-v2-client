export interface IUploadFile {
    id?: string;
    fileName?: string;
    fileType?: string;
    filePath?: string;
    presignedUrl?: string | undefined | null;
}

export interface IFloorPlanArea {
    id: string | null | undefined;
    x: number;
    y: number;
    dataSetInfoId: string;
}

export interface IFloor extends IUploadFile {
    id: string;
    level: string;
    name: string;
    dataSetId: string;
    areas?: IFloorPlanArea[];
}

export interface IMarkerFilter {
    attribute: string;
    operator: string;
    options: string[];
}

export type ITool = "select" | "mark";
