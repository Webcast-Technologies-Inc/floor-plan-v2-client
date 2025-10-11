export interface IFloorPlanAreaDetails {
    name: string;
    description: string;
}

export interface IFloorPlanArea {
    id: string;
    x: number;
    y: number;
    pageNumber: number;
    details: IFloorPlanAreaDetails;
}

export interface IFloorPlan {
    id: string;
    pathname: string;
}

export interface IFloor {
    id: string;
    level: string;
    name: string;
    floorPlans: IFloorPlan[];
}
