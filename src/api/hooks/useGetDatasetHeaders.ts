import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { client2 } from "../apolloClient";
import GET_DATASET_HEADERS_QUERY from "../queries/getDatasetHeaders";

// Define column type if you don't already have it elsewhere
export type ColumnType = "string" | "number" | "boolean" | "date" | "unknown";

// --- Types matching your GraphQL query ---
export interface GetDatasetInfoHeadersVariables {
    getDatasetInfoHeadersId: string;
}

export interface GetDatasetInfoHeadersResponse {
    get_dataset_info_headers: {
        headers?: Array<{
            name: string;
            type: ColumnType;
        }> | null;
        errors?: Array<{
            location: string;
            message: string;
        }> | null;
    };
}

// --- Custom hook ---
export const useGetDatasetHeaders = () => {
    const [getDatasetHeaders, { data, loading, error }] = useLazyQuery<
        GetDatasetInfoHeadersResponse,
        GetDatasetInfoHeadersVariables
    >(GET_DATASET_HEADERS_QUERY, {
        fetchPolicy: "network-only",
        client: client2,
    });

    const handleGetDatasetHeaders = useCallback(
        (variables: GetDatasetInfoHeadersVariables) => {
            return getDatasetHeaders({ variables });
        },
        [getDatasetHeaders]
    );

    return {
        handleGetDatasetHeaders,
        data: data?.get_dataset_info_headers?.headers,
        errors: data?.get_dataset_info_headers?.errors,
        loading,
        error,
    };
};
