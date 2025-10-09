import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { DELETE_FLOOR_MUTATION } from "../mutations/deleteFloor";

interface IDeleteFloorInput {
    landmarkId: string;
    id: string;
}

export const useDeleteFloor = () => {
    const [variables, { data, loading, error }] = useMutation(DELETE_FLOOR_MUTATION);

    const handleDeleteFloor = useCallback((info: IDeleteFloorInput) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleDeleteFloor, data, loading, error };
};
