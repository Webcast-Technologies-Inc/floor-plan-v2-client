import { PushpinFilled, PushpinTwoTone } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { ITool } from "../../pages/Home";
import type { Marker } from "../../types/marker";

interface MarkerPointProps {
    marker: Marker;
    isSelected: boolean;
    selectedTool: ITool;
    isHighlighted: boolean;
    onClick: () => void;
    onDragEnd: (x: number, y: number) => void;
}

export const MarkerPoint = ({
    marker,
    isSelected,
    selectedTool,
    isHighlighted,
    onClick,
    onDragEnd,
}: MarkerPointProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: marker.x, y: marker.y });
    const markerRef = useRef<HTMLDivElement>(null);
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialMarkerPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setPosition({ x: marker.x, y: marker.y });
    }, [marker.x, marker.y]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // only start dragging with left mouse button
        if (selectedTool !== "select" || (e as React.MouseEvent).button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        setIsDragging(true);
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialMarkerPos.current = { x: position.x, y: position.y };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const deltaX = e.clientX - initialMousePos.current.x;
            const deltaY = e.clientY - initialMousePos.current.y;

            setPosition({
                x: initialMarkerPos.current.x + deltaX,
                y: initialMarkerPos.current.y + deltaY,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (position.x !== marker.x || position.y !== marker.y) {
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

    return (
        <div
            ref={markerRef}
            className={`absolute transition-transform duration-200 ${
                isDragging ? "scale-110 z-50" : isSelected ? "scale-105 z-40" : "z-30"
            } ${selectedTool === "select" ? "hover:scale-110" : ""}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translate(-50%, -100%)",
                userSelect: "none",
                cursor: isDragging ? "grabbing" : "pointer",
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <div className="relative">
                {isSelected ? (
                    <PushpinFilled
                        style={{ color: "#3b82f6" }} // filled pin color
                        className="text-lg drop-shadow-[0_0_8px_hsl(200_95%_55%/0.6)] transition-all duration-500"
                    />
                ) : (
                    <PushpinTwoTone
                        twoToneColor={"#3b82f6"}
                        className={`text-lg transition-all duration-500 ${
                            isHighlighted
                                ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                                : "drop-shadow-none opacity-0"
                        }`}
                    />
                )}
                {/* <PushpinTwoTone
                    twoToneColor={
                        isHighlighted
                            ? "#3b82f6" // blue-500
                            : isSelected
                            ? "hsl(200 95% 55%)"
                            : "transparent"
                    }
                    className={`text-lg transition-all duration-500 ${
                        isHighlighted
                            ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                            : isSelected
                            ? "drop-shadow-[0_0_8px_hsl(200 95% 55%/0.6)]"
                            : "drop-shadow-none opacity-0"
                    }`}
                /> */}
                {/* <MapPin
                    className={`w-8 h-8 transition-all duration-500 ${
                        isHighlighted
                            ? "text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                            : isSelected
                            ? "text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]"
                            : "text-transparent drop-shadow-none"
                    }`}
                    fill="currentColor"
                    stroke={isHighlighted || isSelected ? "currentColor" : "transparent"}
                    strokeWidth={2}
                /> */}
                {/* {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full animate-pulse" />
                )} */}
            </div>
            {/* <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded px-2 py-1 text-xs font-medium whitespace-nowrap shadow-md">
                {marker.details.name || `Marker ${marker.id}`}
            </div> */}
        </div>
    );
};
