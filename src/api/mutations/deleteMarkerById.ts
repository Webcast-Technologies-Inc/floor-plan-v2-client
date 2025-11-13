import { gql } from "@apollo/client";

export const DELETE_MARKER_BY_ID_MUTATION = gql`
    mutation DeleteMarkerById($floorId: ID!, $id: ID!) {
        deleteMarkerById(id: $id, floorId: $floorId) {
            success
            message
            id
        }
    }
`;
