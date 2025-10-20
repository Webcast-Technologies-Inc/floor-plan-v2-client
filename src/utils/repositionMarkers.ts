import type { IFloorPlanArea } from "../types/floorPlan";

/**
 * Repositions markers that are out of bounds to fit within the new image dimensions
 * @param markers - Array of floor plan area markers
 * @param newWidth - Width of the new image/container
 * @param newHeight - Height of the new image/container
 * @returns Array of markers with adjusted positions
 */
export const repositionOutOfBoundsMarkers = (
    markers: IFloorPlanArea[] | undefined,
    newWidth: number,
    newHeight: number
): IFloorPlanArea[] => {
    if (!markers || markers.length === 0) {
        return [];
    }

    const markerSize = 24; // Size of the pin icon

    return markers.map((marker) => {
        let adjustedX = marker.x;
        let adjustedY = marker.y;

        // Check if marker is out of bounds and reposition if necessary
        const minX = markerSize / 2;
        const maxX = newWidth - markerSize / 2;
        const minY = markerSize;
        const maxY = newHeight;

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
