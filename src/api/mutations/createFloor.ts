import { gql } from "@apollo/client";

export const CREATE_FLOOR_MUTATION = gql`
    mutation CreateFloor(
        $landmarkId: ID!
        $level: String!
        $name: String!
        $dataSetId: ID!
        $fileName: String!
        $fileType: String!
        $filePath: String!
    ) {
        createFloor(
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
        }
    }
`;
