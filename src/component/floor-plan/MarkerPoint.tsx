import { PushpinOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";

export interface Marker {
    id: string;
    x: number;
    y: number;
    name: string;
    description: string;
}

interface MarkerPointProps {
    marker: Marker;
    isSelected: boolean;
    mode: "select" | "mark";
    isHighlighted: boolean;
    onClick: () => void;
    onDragEnd: (x: number, y: number) => void;
}

export const MarkerPoint = ({
    marker,
    isSelected,
    mode,
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
        if (mode !== "select") return;
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

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
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
                isDragging
                    ? "scale-110 z-50 cursor-grabbing"
                    : isSelected
                    ? "scale-105 z-40"
                    : "z-30"
            } ${mode === "select" ? "cursor-grab hover:scale-110" : "cursor-pointer"}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translate(-50%, -100%)",
                userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <div className="relative">
                <PushpinOutlined />
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
                {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full animate-pulse" />
                )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded px-2 py-1 text-xs font-medium whitespace-nowrap shadow-md">
                {marker.name || `Marker ${marker.id}`}
            </div>
        </div>
    );
};
