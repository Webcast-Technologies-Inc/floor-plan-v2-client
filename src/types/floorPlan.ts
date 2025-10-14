export interface IFloorPlanArea {
    id: string | null | undefined;
    x: number;
    y: number;
    name: string;
    description: string;
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
