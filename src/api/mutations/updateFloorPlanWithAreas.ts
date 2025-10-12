import { gql } from "@apollo/client";

export const UPDATE_FLOOR_PLAN_WITH_AREAS_MUTATION = gql`
    mutation UpdateFloorPlanWithAreas(
        $floorId: ID!
        $id: ID
        $attachments: AttachmentInput
        $areas: [FloorPlanAreaInput]
    ) {
        updateFloorPlanWithAreas(
            floorId: $floorId
            id: $id
            attachments: $attachments
            areas: $areas
        ) {
            id
            areas {
                id
                x
                y
                details {
                    name
                    description
                }
            }
            attachments {
                id
                fileName
                fileType
                filePath
            }
        }
    }
`;
