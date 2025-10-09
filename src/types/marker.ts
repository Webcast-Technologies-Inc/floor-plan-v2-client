export interface MarkerDetails {
    name: string;
    description: string;
}

export interface Marker {
    id: string;
    x: number;
    y: number;
    details: MarkerDetails;
}
