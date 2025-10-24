import { gql } from "@apollo/client";

const GET_ATTRIBUTE_OPTIONS_QUERY = gql`
    query getDatasetAttributeOptions(
        $getDatasetAttributeOptionsId: ID!
        $attributeName: String!
        $args: RetrieveAllInput
    ) {
        get_dataset_attribute_options(
            id: $getDatasetAttributeOptionsId
            attribute_name: $attributeName
            args: $args
        ) {
            errors {
                location
                message
            }
            options
            attribute
        }
    }
`;

export default GET_ATTRIBUTE_OPTIONS_QUERY;
