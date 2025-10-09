import { gql } from "@apollo/client";

export const CREATE_FLOOR_MUTATION = gql`
    mutation CreateFloor($landmarkId: ID!, $level: String!, $name: String!) {
        createFloor(landmarkId: $landmarkId, level: $level, name: $name) {
            id
            level
            name
        }
    }
`;
