import { gql } from "@apollo/client";

export const CREATE_FLOOR_PLAN_AREA_MUTATION = gql`
    mutation CreateFloorPlanArea(
        $floorPlanId: ID!
        $x: String!
        $y: String!
        $pageNumber: Int!
        $details: JSON!
    ) {
        createFloorPlanArea(
            floorPlanId: $floorPlanId
            x: $x
            y: $y
            pageNumber: $pageNumber
            details: $details
        ) {
            id
            x
            y
            pageNumber
            details {
                name
                description
            }
        }
    }
`;
