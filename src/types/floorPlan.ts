export interface IFloorPlanArea {
    id: string | null | undefined;
    x: number;
    y: number;
    id_primary: string;
    alias: string;
}

export interface IFloor {
    id: string;
    level: string;
    name: string;
    fileName?: string;
    fileType?: string;
    filePath?: string;
    presignedUrl?: string | undefined | null;
    areas?: IFloorPlanArea[];
}

export type ITool = "select" | "mark";
