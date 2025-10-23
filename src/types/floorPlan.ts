export interface IFloorPlanArea {
    id: string | null | undefined;
    x: number;
    y: number;
    dataSetInfoId: string;
}

export interface IFloor {
    id: string;
    level: string;
    name: string;
    dataSetId: string;
    fileName?: string;
    fileType?: string;
    filePath?: string;
    presignedUrl?: string | undefined | null;
    areas?: IFloorPlanArea[];
}

export interface IMarkerFilter {
    attribute: string;
    oprerator: string;
    options: string[];
}

export type ITool = "select" | "mark";
