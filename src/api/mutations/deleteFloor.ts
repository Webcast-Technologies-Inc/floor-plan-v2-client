import { gql } from "@apollo/client";

export const DELETE_FLOOR_MUTATION = gql`
    mutation DeleteFloor($id: ID!, $landmarkId: ID!) {
        deleteFloor(id: $id, landmarkId: $landmarkId)
    }
`;
