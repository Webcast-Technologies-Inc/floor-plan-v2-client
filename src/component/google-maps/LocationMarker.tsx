import type { Marker } from "@googlemaps/markerclusterer";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useCallback } from "react";

export type LocationMarkerProps<T> = {
    data: T;
    position: google.maps.LatLngLiteral;
    markerKey: string;
    onClick: (item: T) => void;
    setMarkerRef: (marker: Marker | null, key: string) => void;
    renderMarker?: (item: T) => React.ReactNode;
};

const LocationMarker = <T,>({
    data,
    position,
    markerKey,
    onClick,
    setMarkerRef,
    renderMarker,
}: LocationMarkerProps<T>) => {
    const handleClick = useCallback(() => {
        onClick(data);
    }, [onClick, data]);

    const ref = useCallback(
        (marker: google.maps.marker.AdvancedMarkerElement) => setMarkerRef(marker, markerKey),
        [setMarkerRef, markerKey]
    );

    return (
        <AdvancedMarker position={position} ref={ref} onClick={handleClick}>
            {renderMarker?.(data) ?? <span className="text-4xl">📍</span>}
        </AdvancedMarker>
    );
};

export default LocationMarker;
