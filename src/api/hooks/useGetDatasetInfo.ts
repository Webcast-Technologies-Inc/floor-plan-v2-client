import { useLazyQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { client2 } from "../apolloClient";
import { GET_DATASET_INFO_QUERY } from "../queries/getDataSetInfo";

// Input types based on query variables
interface CoordinateInput {
    lat: number;
    lng: number;
}

interface RetrieveAllInput {
    page?: number;
    limit?: number;
    search?: string;
    andConditions?: {
        field: string;
        values: string | number | boolean | (string | number | boolean)[];
    }[];
}

export interface GetDatasetInfoVariables {
    enableDefaultFilters?: boolean;
    getDatasetInfoId: string; // GraphQL variable name must match
    args?: RetrieveAllInput;
    boundingBox?: CoordinateInput[];
}

// Response types based on query return structure
interface DatasetInfoResponse {
    get_dataset_info: {
        errors?: { location: string; message: string }[];
        success: boolean;
        datasets: any[]; // You can define a specific dataset type if available
        count: number;
        total: number;
        __typename: string;
    };
}

export const useGetDatasetInfo = () => {
    const [getDatasetInfo, { data, loading, error }] = useLazyQuery<
        DatasetInfoResponse,
        GetDatasetInfoVariables
    >(GET_DATASET_INFO_QUERY, {
        fetchPolicy: "network-only",
        client: client2,
    });

    const handleGetDatasetInfo = useCallback(
        (variables: GetDatasetInfoVariables) => {
            return getDatasetInfo({ variables });
        },
        [getDatasetInfo]
    );

    return {
        handleGetDatasetInfo,
        data: data?.get_dataset_info,
        loading,
        error,
    };
};
