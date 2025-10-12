import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import type { IAttachment, IFloorPlanArea } from "../../types/floorPlan";
import { UPDATE_FLOOR_PLAN_WITH_AREAS_MUTATION } from "../mutations/updateFloorPlanWithAreas";

interface IUpdateFloorPlanWithAreasInput {
    floorId: string | undefined;
    id?: string | undefined;
    attachments: IAttachment;
    areas: IFloorPlanArea[];
}

export const useUpdateFloorPlanWithAreas = () => {
    const [variables, { data, loading, error }] = useMutation(
        UPDATE_FLOOR_PLAN_WITH_AREAS_MUTATION
    );

    const handleUpdateFloorPlanWithAreas = useCallback((info: IUpdateFloorPlanWithAreasInput) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleUpdateFloorPlanWithAreas, data, loading, error };
};
