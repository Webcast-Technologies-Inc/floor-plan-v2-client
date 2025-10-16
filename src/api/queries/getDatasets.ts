import { gql } from "@apollo/client";

export const GET_DATASETS_QUERY = gql`
    query Get_datasets($args: RetrieveAllInput) {
        get_datasets(args: $args) {
            errors {
                location
                message
            }
            success
            datasets {
                id
                client_id
                filename
                table_name
                status
                cluster
                alias
                properties
            }
        }
    }
`;
