import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { UPDATE_FLOOR_MUTATION } from "../mutations/updateFloor";

interface IUpdateFloorInput {
    landmarkId: string;
    id: string;
    level: string;
    name: string;
}

export const useUpdateFloor = () => {
    const [variables, { data, loading, error }] = useMutation(UPDATE_FLOOR_MUTATION);

    const handleUpdateFloor = useCallback((info: IUpdateFloorInput) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleUpdateFloor, data, loading, error };
};
