import { Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { MARKER_SIZE } from "../../constant";
import type { IFloorPlanArea } from "../../types/floorPlan";

interface IMarkerPoint {
    marker: IFloorPlanArea;
    isSelected: boolean;
    onClick: () => void;
    onDragEnd: (x: number, y: number) => void;
    draggable: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const MarkerPoint = ({
    marker,
    isSelected,
    onClick,
    onDragEnd,
    draggable,
    containerRef,
}: IMarkerPoint) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentPosition, setCurrentPosition] = useState({ x: marker.x, y: marker.y });
    const markerRef = useRef<HTMLDivElement>(null);
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialMarkerPos = useRef({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        setCurrentPosition({ x: marker.x, y: marker.y });
    }, [marker.x, marker.y]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // only start dragging with left mouse button
        if (!draggable || e.button !== 0) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();

        setIsDragging(true);
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialMarkerPos.current = { x: currentPosition.x, y: currentPosition.y };
    };

    useEffect(() => {
        if (!isDragging) {
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            setHasMoved(true);

            const deltaX = e.clientX - initialMousePos.current.x;
            const deltaY = e.clientY - initialMousePos.current.y;

            let newX = initialMarkerPos.current.x + deltaX;
            let newY = initialMarkerPos.current.y + deltaY;

            const container = containerRef.current;

            if (container) {
                const bounds = container.getBoundingClientRect();

                // Clamp within container bounds
                newX = Math.max(MARKER_SIZE / 2, Math.min(newX, bounds.width - MARKER_SIZE / 2));
                newY = Math.max(MARKER_SIZE, Math.min(newY, bounds.height));
            }

            setCurrentPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setHasMoved(false);

            if (currentPosition.x !== marker.x || currentPosition.y !== marker.y) {
                onClick();
                onDragEnd(currentPosition.x, currentPosition.y);
            }
        };

        // set grabbing cursor for the whole document so it stays while dragging
        const previousCursor = document.body.style.cursor;
        document.body.style.cursor = "grabbing";

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = previousCursor;
        };
    }, [isDragging, currentPosition.x, currentPosition.y, marker.x, marker.y, onDragEnd]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDragging) {
            onClick();
        }
    };

    const iconSrc = `/icons/marker-${isSelected ? "selected" : "unselected"}.svg`;
    const icon = <img src={iconSrc} alt="Marker" className="" />;

    return (
        <div
            ref={markerRef}
            className={`absolute transition-transform duration-200 leading-none ${
                isDragging ? "scale-110 z-50" : isSelected ? "scale-105 z-40" : "z-30"
            } ${draggable ? "hover:scale-110" : ""}`}
            style={{
                height: MARKER_SIZE,
                width: MARKER_SIZE,
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: "translate(-50%, -100%)",
                userSelect: "none",
                cursor: hasMoved ? "grabbing" : "pointer",
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {hasMoved ? (
                icon
            ) : (
                <Tooltip
                    placement="top"
                    title={marker.dataSetInfoId}
                    align={{
                        offset: [0, 0], // move tooltip closer to the element (negative = upward)
                    }}
                >
                    {icon}
                </Tooltip>
            )}
        </div>
    );
};
