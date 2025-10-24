import { gql } from "@apollo/client";

const GET_DATASET_HEADERS_QUERY = gql`
    query getDatasetInfoHeaders($getDatasetInfoHeadersId: ID!) {
        get_dataset_info_headers(id: $getDatasetInfoHeadersId) {
            headers {
                name
                type
            }
            errors {
                location
                message
            }
        }
    }
`;

export default GET_DATASET_HEADERS_QUERY;
