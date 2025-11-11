import { gql } from "@apollo/client";

export const UPDATE_FLOOR_MUTATION = gql`
    mutation UpdateFloor(
        $id: ID!
        $landmarkId: ID!
        $level: String!
        $name: String!
        $dataSetId: ID!
        $fileName: String!
        $fileType: String!
        $filePath: String!
    ) {
        updateFloor(
            id: $id
            landmarkId: $landmarkId
            level: $level
            name: $name
            dataSetId: $dataSetId
            fileName: $fileName
            fileType: $fileType
            filePath: $filePath
        ) {
            id
            level
            name
            dataSetId
            fileName
            fileType
            filePath
            fileType
        }
    }
`;
