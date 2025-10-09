import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { GET_LANDMARK_BY_ID_QUERY } from "../queries/getLandmarkById";

export const useGetLandmarkById = () => {
    const [variables, { data, loading, error }] = useLazyQuery<any>(GET_LANDMARK_BY_ID_QUERY, {
        fetchPolicy: "network-only",
    });

    const handleGetLandmarkById = useCallback(
        (id: string) => {
            return variables({
                variables: { id },
            });
        },
        [variables]
    );

    return { handleGetLandmarkById, data, loading, error };
};
