import { gql } from "@apollo/client";

export const UPDATE_FLOOR_MUTATION = gql`
    mutation UpdateFloor(
        $id: ID!
        $landmarkId: ID!
        $level: String!
        $name: String!
        $dataSetId: ID!
    ) {
        updateFloor(
            id: $id
            landmarkId: $landmarkId
            level: $level
            name: $name
            dataSetId: $dataSetId
        ) {
            id
            level
            name
            dataSetId
        }
    }
`;
