import { gql } from "@apollo/client";

export const GET_FLOOR_BY_LEVEL_ID_QUERY = gql`
    query GetFloorByLevelId($floorId: String!) {
        getFloorByLevelId(floorId: $floorId) {
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
