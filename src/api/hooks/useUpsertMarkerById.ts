import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import type { IFloorPlanArea } from "../../types/floorPlan";
import { UPSERT_MARKER_BY_ID_MUTATION } from "../mutations/upsertMarkerById";

export interface IUpsertMarkerById extends IFloorPlanArea {
    floorId: string;
}

export const useUpsertMarkerById = () => {
    const [variables, { data, loading, error }] = useMutation(UPSERT_MARKER_BY_ID_MUTATION);

    const handleUpsertMarkerById = useCallback((info: IUpsertMarkerById) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleUpsertMarkerById, data, loading, error };
};
