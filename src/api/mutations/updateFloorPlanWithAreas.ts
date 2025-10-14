import { gql } from "@apollo/client";

export const UPDATE_FLOOR_PLAN_WITH_AREAS_MUTATION = gql`
    mutation UpdateFloorPlanWithAreas(
        $id: ID!
        $fileName: String!
        $fileType: String!
        $filePath: String!
        $areas: [FloorPlanAreaInput]
    ) {
        updateFloorPlanWithAreas(
            id: $id
            fileName: $fileName
            fileType: $fileType
            filePath: $filePath
            areas: $areas
        ) {
            id
            level
            name
            fileName
            fileType
            filePath
            presignedUrl
            areas {
                id
                x
                y
                name
                description
            }
        }
    }
`;
