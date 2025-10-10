import { gql } from "@apollo/client";

export const CREATE_FLOOR_PLAN_MUTATION = gql`
    mutation CreateFloorPlan($floorId: ID!, $pathname: String!) {
        createFloorPlan(floorId: $floorId, pathname: $pathname) {
            id
            pathname
        }
    }
`;
