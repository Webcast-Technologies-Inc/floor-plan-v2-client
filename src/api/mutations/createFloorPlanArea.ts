import { gql } from "@apollo/client";

export const CREATE_FLOOR_PLAN_AREA_MUTATION = gql`
    mutation CreateFloorPlanArea(
        $floorPlanId: ID!
        $x: Float!
        $y: Float!
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
                dataSetInfoId
            }
        }
    }
`;
