export interface IAttachment {
    id?: string | null;
    fileName: string;
    fileType: string;
    filePath: string;
    presignedUrl?: string | undefined | null;
}
export interface IFloorPlanAreaDetails {
    name: string;
    description: string;
}

export interface IFloorPlanArea {
    id: string | null | undefined;
    x: number;
    y: number;
    details?: IFloorPlanAreaDetails;
}

export interface IFloorPlan {
    id?: string;
    areas?: IFloorPlanArea[];
    attachments?: IAttachment;
}

export interface IFloor {
    id: string;
    level: string;
    name: string;
    floorPlans?: IFloorPlan;
}

export type ITool = "select" | "mark";
