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
                        renderPopup={(e, close) => (
                            <div className="absolute bottom-[4.4rem] -translate-x-1/2">
                                <div className="relative w-[330px] bg-[rgba(0,0,0,0.8)] text-sm text-white rounded-md">
                                    {/* Arrow */}
                                    <div className="h-10 w-[68px] absolute -bottom-10 left-1/2 -translate-x-1/2 rotate-180 bg-[rgba(0,0,0,0.8)] [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)]" />

                                    <div className="max-h-96 !p-5 !space-y-7 overflow-auto">
                                        <div className="text-[15px] font-bold grid grid-cols-2 items-center [&>*:nth-child(even)]:text-right">
                                            <p>Market Block</p>
                                            <button onClick={close} className="cursor-pointer">
                                                close
                                            </button>
                                        </div>
                                        <div className="text-[13px] grid grid-cols-2 items-center [&>*:nth-child(even)]:text-right gap-y-[5px]">
                                            <p>FLOOR PLAN</p>
                                            <span>
                                                <Button
                                                    icon={<EyeOutlined />}
                                                    onClick={() => {
                                                        navigate(
                                                            `/floor-plan?id=${e.id}&name=${e.name}`
                                                        );
                                                    }}
                                                />
                                            </span>

                                            <p>Id :</p>
                                            <p>{e.id}</p>

                                            <p>Name :</p>
                                            <p>{e.name}</p>

                                            <p>Category :</p>
                                            <p>{e.category}</p>

                                            <p>Longitude :</p>
                                            <p>{e.longitude}</p>

                                            <p>Latitude :</p>
                                            <p>{e.latitude}</p>
                                        </div>
                                    </div>
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
