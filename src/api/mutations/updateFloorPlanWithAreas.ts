import { gql } from "@apollo/client";

export const UPDATE_FLOOR_PLAN_WITH_AREAS_MUTATION = gql`
    mutation UpdateFloorPlanWithAreas($id: ID!, $areas: [FloorPlanAreaInput]) {
        updateFloorPlanWithAreas(id: $id, areas: $areas) {
            id
            level
            name
            dataSetId
            fileName
            fileType
            filePath
            presignedUrl
            areas {
                id
                x
                y
                dataSetInfoId
            }
        }
    }
`;
