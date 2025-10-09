import { useQuery } from "@apollo/client/react";
import { GET_ALL_LANDMARK_QUERY } from "../queries/getAllLandmark";

// Types matching the GraphQL schema/selection set
export type Landmark = {
    id: string;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    updatedAt: string;
};

export type GetAllLandmarksData = {
    getLandmarks: Landmark[];
};

export const useGetAllLandmark = () => {
    const response = useQuery<GetAllLandmarksData>(GET_ALL_LANDMARK_QUERY);

    return response;
};
