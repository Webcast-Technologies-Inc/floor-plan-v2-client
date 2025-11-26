import type { IFloorPlanArea } from "../types/floorPlan";

/**
 * Repositions markers that are out of bounds to fit within the new image dimensions
 * @param markers - Array of floor plan area markers
 * @param fileWidth - Width of the new image/container
 * @param fileHeight - Height of the new image/container
 * @param markerWidth - Width of the marker
 * @param markerHeight - Height of the marker
 * @returns Array of markers with adjusted positions
 */
export const repositionOutOfBoundsMarkers = (
    markers: IFloorPlanArea[] | undefined,
    fileWidth: number,
    fileHeight: number,
    markerWidth: number,
    markerHeight: number
): IFloorPlanArea[] => {
    if (!markers || markers.length === 0) {
        return [];
    }

    return markers.map((marker) => {
        let adjustedX = marker.x;
        let adjustedY = marker.y;

        // Check if marker is out of bounds and reposition if necessary
        const minX = markerWidth / 2;
        const maxX = fileWidth - markerWidth / 2;
        const minY = markerHeight;
        const maxY = fileHeight;

        // Clamp X coordinate
        if (adjustedX < minX) {
            adjustedX = minX;
        } else if (adjustedX > maxX) {
            adjustedX = maxX;
        }

        // Clamp Y coordinate
        if (adjustedY < minY) {
            adjustedY = minY;
        } else if (adjustedY > maxY) {
            adjustedY = maxY;
        }

        // Return original marker if no changes needed, otherwise return updated marker
        if (adjustedX === marker.x && adjustedY === marker.y) {
            return marker;
        }

        return {
            ...marker,
            x: adjustedX,
            y: adjustedY,
        };
    });
};
