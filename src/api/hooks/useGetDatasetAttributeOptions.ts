import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { client2 } from "../apolloClient";
import GET_ATTRIBUTE_OPTIONS_QUERY from "../queries/getDatasetAttributeOptions";

// --- Types matching your GraphQL query ---
export interface RetrieveAllInput {
    page?: number;
    offset?: number;
    limit?: number;
    search?: string;
    andConditions?: {
        field: string;
        values: string | number | boolean | (string | number | boolean)[];
    }[];
}

export interface GetDatasetAttributeOptionsVariables {
    getDatasetAttributeOptionsId: string;
    attributeName: string;
    args?: RetrieveAllInput;
}

export interface GetDatasetAttributeOptionsResponse {
    get_dataset_attribute_options: {
        errors?: Array<{
            location: string;
            message: string;
        }> | null;
        options?: (string | number | boolean)[] | null;
        attribute?: string | null;
    };
}

// --- Custom hook ---
export const useGetDatasetAttributeOptions = () => {
    const [getAttributeOptions, { data, loading, error }] = useLazyQuery<
        GetDatasetAttributeOptionsResponse,
        GetDatasetAttributeOptionsVariables
    >(GET_ATTRIBUTE_OPTIONS_QUERY, {
        fetchPolicy: "network-only",
        client: client2,
    });

    const handleGetAttributeOptions = useCallback(
        (variables: GetDatasetAttributeOptionsVariables) => {
            return getAttributeOptions({ variables });
        },
        [getAttributeOptions]
    );

    return {
        handleGetAttributeOptions,
        data: data?.get_dataset_attribute_options?.options ?? [],
        attribute: data?.get_dataset_attribute_options?.attribute ?? null,
        errors: data?.get_dataset_attribute_options?.errors ?? [],
        loading,
        error,
    };
};
