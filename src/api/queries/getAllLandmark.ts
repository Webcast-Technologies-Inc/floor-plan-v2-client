import { gql } from "@apollo/client";

export const GET_ALL_LANDMARK_QUERY = gql`
    query GET_ALL_LANDMARKS {
        getLandmarks {
            id
            name
            category
            latitude
            longitude
            createdAt
            updatedAt
        }
    }
`;
