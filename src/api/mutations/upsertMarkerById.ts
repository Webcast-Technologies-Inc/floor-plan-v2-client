import { gql } from "@apollo/client";

export const UPSERT_MARKER_BY_ID_MUTATION = gql`
    mutation UpsertMarkerById(
        $floorId: ID!
        $id: ID
        $x: Float!
        $y: Float!
        $dataSetInfoId: String!
    ) {
        upsertMarkerById(floorId: $floorId, id: $id, x: $x, y: $y, dataSetInfoId: $dataSetInfoId) {
            id
            x
            y
            dataSetInfoId
            createdAt
            updatedAt
        }
    }
`;
