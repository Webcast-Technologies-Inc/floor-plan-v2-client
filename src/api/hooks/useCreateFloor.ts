import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { CREATE_FLOOR_MUTATION } from "../mutations/createFloor";

interface ICreateFloorInput {
    landmarkId: string;
    level: string;
    name: string;
}

export const useCreateFloor = () => {
    const [variables, { data, loading, error }] = useMutation(CREATE_FLOOR_MUTATION);

    const handleCreateFloor = useCallback((info: ICreateFloorInput) => {
        return variables({
            variables: {
                ...info,
            },
        });
    }, []);

    return { handleCreateFloor, data, loading, error };
};
