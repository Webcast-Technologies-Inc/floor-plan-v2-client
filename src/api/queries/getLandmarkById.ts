import { gql } from "@apollo/client";

export const GET_LANDMARK_BY_ID_QUERY = gql`
    query GetLandmarkById($id: ID!) {
        getLandmarkById(id: $id) {
            id
            name
            category
            latitude
            longitude
            floor {
                id
                level
                name
            }
        }
    }
`;
