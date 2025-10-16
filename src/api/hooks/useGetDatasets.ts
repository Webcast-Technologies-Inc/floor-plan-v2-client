import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { client2 } from "../apolloClient";
import { GET_DATASETS_QUERY } from "../queries/getDatasets";

// Input for pagination/search
export interface RetrieveAllInput {
    page?: number;
    limit?: number;
    search?: string;
    andConditions?: { field: string; values: string | number | boolean }[];
}

// Dataset record structure (you can expand types as needed)
export interface Dataset {
    id: string;
    client_id: string;
    filename: string;
    table_name: string;
    status: string;
    cluster?: string;
    alias?: string;
    properties?: Record<string, any>;
}

// API response structure
interface GetDatasetsResponse {
    get_datasets: {
        errors?: { location: string; message: string }[];
        success: boolean;
        datasets: Dataset[];
    };
}

// Variables passed into the query
interface GetDatasetsVariables {
    args?: RetrieveAllInput;
}

// --- React Hook ---
export const useGetDatasets = () => {
    const [getDatasets, { data, loading, error }] = useLazyQuery<
        GetDatasetsResponse,
        GetDatasetsVariables
    >(GET_DATASETS_QUERY, {
        fetchPolicy: "network-only",
        client: client2,
    });

    const handleGetDatasets = useCallback(
        (variables?: GetDatasetsVariables) => {
            return getDatasets({ variables });
        },
        [getDatasets]
    );

    return {
        handleGetDatasets,
        data: data?.get_datasets,
        loading,
        error,
    };
};
