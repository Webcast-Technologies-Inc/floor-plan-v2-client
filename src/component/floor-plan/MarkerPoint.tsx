import { useEffect, useRef, useState } from "react";

interface IMarker {
    containerRef: React.RefObject<HTMLDivElement | null>;
    height?: number;
    width?: number;
    position: {
        x: number;
        y: number;
    };
    isSelected: boolean;
    onClick: () => void;
    onDragEnd: (x: number, y: number) => void;
    draggable: boolean;
    render?: (state: {
        isSelected: boolean;
        isDragging: boolean;
        hasMoved: boolean;
    }) => React.ReactNode;
}

const Marker = ({
    containerRef,
    height = 24,
    width = 24,
    position,
    isSelected,
    onClick,
    onDragEnd,
    draggable,
    render,
}: IMarker) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentPosition, setCurrentPosition] = useState({ x: position.x, y: position.y });
    const markerRef = useRef<HTMLDivElement>(null);
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialMarkerPos = useRef({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        setCurrentPosition({ x: position.x, y: position.y });
    }, [position.x, position.y]);

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
                newX = Math.max(width / 2, Math.min(newX, bounds.width - width / 2));
                newY = Math.max(height, Math.min(newY, bounds.height));
            }

            setCurrentPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setHasMoved(false);

            if (currentPosition.x !== position.x || currentPosition.y !== position.y) {
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
    }, [isDragging, currentPosition.x, currentPosition.y, position.x, position.y, onDragEnd]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDragging) {
            onClick();
        }
    };

    return (
        <div
            ref={markerRef}
            className={`absolute flex items-center justify-center transition-transform duration-200 leading-none ${
                isDragging ? "scale-110 z-50" : isSelected ? "scale-105 z-40" : "z-30"
            } ${draggable ? "hover:scale-110" : ""}`}
            style={{
                height: height,
                width: width,
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: "translate(-50%, -100%)",
                userSelect: "none",
                cursor: hasMoved ? "grabbing" : "pointer",
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {render?.({ isSelected, isDragging, hasMoved }) ?? <span>📌</span>}
        </div>
    );
};

export default Marker;
