import { gql } from "@apollo/client";

export const GET_FLOOR_BY_LEVEL_ID_QUERY = gql`
    query GetFloorByLevelId($landmarkId: ID!, $levelId: String!) {
        getFloorByLevelId(landmarkId: $landmarkId, levelId: $levelId) {
            id
            level
            name
            floorPlans {
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
                    presignedUrl
                }
            }
        }
    }
`;
