import { type Marker, MarkerClusterer } from "@googlemaps/markerclusterer";
import { InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import LocationMarker from "./LocationMarker";

export type ClusteredLocationMarkersProps<T> = {
    data: T[];
    getKey: (item: T) => string;
    getPosition: (item: T) => google.maps.LatLngLiteral;
    renderMarker?: (item: T) => React.ReactNode;
    renderInfoWindow?: (item: T) => React.ReactNode;
    onMarkerClick?: (item: T) => void;
};

const ClusteredLocationMarkers = <T,>({
    data,
    getKey,
    getPosition,
    renderMarker,
    renderInfoWindow,
    onMarkerClick,
}: ClusteredLocationMarkersProps<T>) => {
    const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    const map = useMap();

    const clusterer = useMemo(() => {
        if (!map) return null;
        return new MarkerClusterer({ map });
    }, [map]);

    useEffect(() => {
        if (!clusterer) return;
        clusterer.clearMarkers();
        clusterer.addMarkers(Object.values(markers));
    }, [clusterer, markers]);

    const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
        setMarkers((markers) => {
            if ((marker && markers[key]) || (!marker && !markers[key])) return markers;

            if (marker) {
                return { ...markers, [key]: marker };
            } else {
                const { [key]: _, ...newMarkers } = markers;
                return newMarkers;
            }
        });
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        setSelectedKey(null);
    }, []);

    const handleMarkerClick = useCallback(
        (item: T) => {
            setSelectedKey(getKey(item));

            if (onMarkerClick) {
                onMarkerClick(item);
            }
        },
        [getKey]
    );

    const selectedItem = useMemo(() => {
        return data.find((item) => getKey(item) === selectedKey) ?? null;
    }, [data, getKey, selectedKey]);

    return (
        <>
            {data.map((item) => {
                const key = getKey(item);
                const position = getPosition(item);

                return (
                    <LocationMarker
                        key={key}
                        data={item}
                        position={position}
                        onClick={handleMarkerClick}
                        setMarkerRef={setMarkerRef}
                        renderMarker={renderMarker}
                        markerKey={key}
                    />
                );
            })}

            {renderInfoWindow && selectedKey && selectedItem && (
                <InfoWindow anchor={markers[selectedKey]} onCloseClick={handleInfoWindowClose}>
                    {renderInfoWindow?.(selectedItem) ?? <div>{selectedKey}</div>}
                </InfoWindow>
            )}
        </>
    );
};

export default ClusteredLocationMarkers;
