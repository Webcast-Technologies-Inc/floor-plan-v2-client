import { EyeOutlined } from "@ant-design/icons";
import { Map } from "@vis.gl/react-google-maps";
import { Alert, Button, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetAllLandmark } from "../api/hooks/useGetAllLandmark";
import ClusteredLocationMarkers from "../component/google-maps/ClusteredLocationMarkers";
import { MANILA_POSITION } from "../constant";

const Home = () => {
    const navigate = useNavigate();
    const { data, loading, error } = useGetAllLandmark();

    return (
        <>
            <div className="min-h-screen">
                {loading && (
                    <div className="p-4">
                        <Spin tip="Loading landmarks..." />
                    </div>
                )}
                {error && (
                    <div className="p-4">
                        <Alert
                            type="error"
                            message="Failed to load landmarks"
                            description={(error as Error).message}
                            showIcon
                        />
                    </div>
                )}
                <Map
                    style={{ height: "100vh" }}
                    mapId={import.meta.env.VITE_MAP_ID || ""}
                    defaultZoom={10}
                    defaultCenter={MANILA_POSITION}
                    gestureHandling={"greedy"}
                    disableDefaultUI
                >
                    <ClusteredLocationMarkers
                        data={data?.getLandmarks ?? []}
                        getKey={({ id }) => id}
                        getPosition={({ latitude, longitude }) => ({
                            lat: +latitude,
                            lng: +longitude,
                        })}
                        renderMarker={() => <span className="text-2xl">📍</span>}
                        renderInfoWindow={(e) => (
                            <div className="grid grid-cols-2">
                                <div>
                                    <p>Id :</p>
                                    <p>Name :</p>
                                    <p>Category :</p>
                                    <p>Longitude :</p>
                                    <p>Latitude :</p>
                                    <p>Floor Plan :</p>
                                </div>
                                <div>
                                    <div>{e.id}</div>
                                    <div>{e.name}</div>
                                    <div>{e.category}</div>
                                    <div>{e.longitude}</div>
                                    <div>{e.latitude}</div>
                                    <Button
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                            navigate(`/floor-plan?id=${e.id}&name=${e.name}`);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    />
                </Map>
            </div>
        </>
    );
};

export default Home;
