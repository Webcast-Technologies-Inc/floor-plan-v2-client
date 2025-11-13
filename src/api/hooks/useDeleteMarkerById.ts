import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { DELETE_MARKER_BY_ID_MUTATION } from "../mutations/deleteMarkerById";

interface IDeleteMarkerByIdInput {
    floorId: string;
    id: string;
}

export const useDeleteMarkerById = () => {
    const [variables, { data, loading, error }] = useMutation(DELETE_MARKER_BY_ID_MUTATION);

    const handleDeleteMarkerById = useCallback((info: IDeleteMarkerByIdInput) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleDeleteMarkerById, data, loading, error };
};
