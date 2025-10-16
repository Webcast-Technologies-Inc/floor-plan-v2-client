import { gql } from "@apollo/client";

export const GET_DATASET_INFO_QUERY = gql`
    query getDatasetInfo(
        $enableDefaultFilters: Boolean
        $getDatasetInfoId: ID!
        $args: RetrieveAllInput
        $bounding_box: [Coordinate]
    ) {
        get_dataset_info(
            enableDefaultFilters: $enableDefaultFilters
            id: $getDatasetInfoId
            args: $args
            bounding_box: $bounding_box
        ) {
            errors {
                location
                message
                __typename
            }
            success
            datasets
            count
            total
            __typename
        }
    }
`;
