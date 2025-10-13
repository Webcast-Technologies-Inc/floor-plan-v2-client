import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { GET_FLOOR_BY_LEVEL_ID_QUERY } from "../queries/getFloorByLevelId";

interface IGetFloorByLevelIdInput {
    floorId: string;
}

export const useGetFloorByLevelId = () => {
    const [variables, { data, loading, error }] = useLazyQuery<any>(GET_FLOOR_BY_LEVEL_ID_QUERY, {
        fetchPolicy: "network-only",
    });

    const handleGetFloorByLevelId = useCallback(
        (info: IGetFloorByLevelIdInput) => {
            return variables({
                variables: info,
            });
        },
        [variables]
    );

    return { handleGetFloorByLevelId, data, loading, error };
};
