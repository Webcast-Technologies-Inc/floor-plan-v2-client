import { gql } from "@apollo/client";

export const CREATE_FLOOR_MUTATION = gql`
    mutation CreateFloor($landmarkId: ID!, $level: String!, $name: String!, $dataSetId: ID!) {
        createFloor(landmarkId: $landmarkId, level: $level, name: $name, dataSetId: $dataSetId) {
            id
            level
            name
            dataSetId
        }
    }
`;
