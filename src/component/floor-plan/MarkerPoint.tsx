import { Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import type { IFloorPlanArea, ITool } from "../../types/floorPlan";

interface MarkerPointProps {
    marker: IFloorPlanArea;
    isSelected: boolean;
    selectedTool: ITool;
    isHighlighted: boolean;
    onClick: () => void;
    onDragEnd: (x: number, y: number) => void;
    isEditable: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const MarkerPoint = ({
    marker,
    isSelected,
    selectedTool,
    isHighlighted,
    onClick,
    onDragEnd,
    isEditable,
    containerRef,
}: MarkerPointProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: marker.x, y: marker.y });
    const markerRef = useRef<HTMLDivElement>(null);
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialMarkerPos = useRef({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        setPosition({ x: marker.x, y: marker.y });
    }, [marker.x, marker.y]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // only start dragging with left mouse button
        if (!isEditable || e.button !== 0) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();

        setIsDragging(true);
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialMarkerPos.current = { x: position.x, y: position.y };
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
            const markerSize = 24; // Approximate size of the pin icon

            if (container) {
                const bounds = container.getBoundingClientRect();

                // Clamp within container bounds
                newX = Math.max(markerSize / 2, Math.min(newX, bounds.width - markerSize / 2));
                newY = Math.max(markerSize, Math.min(newY, bounds.height));
            }

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setHasMoved(false);

            if (position.x !== marker.x || position.y !== marker.y) {
                onClick();
                onDragEnd(position.x, position.y);
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
    }, [isDragging, position.x, position.y, marker.x, marker.y, onDragEnd]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDragging) {
            onClick();
        }
    };

    const iconSrc = `/icons/marker-${isSelected ? "selected" : "unselected"}.svg`;
    const icon = <img src={iconSrc} alt="Marker" className="h-6" />;

    return (
        <div
            ref={markerRef}
            className={`absolute transition-transform duration-200 leading-none ${
                isDragging ? "scale-110 z-50" : isSelected ? "scale-105 z-40" : "z-30"
            } ${isEditable ? "hover:scale-110" : ""}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
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
