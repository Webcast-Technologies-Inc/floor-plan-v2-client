import { Map } from "@vis.gl/react-google-maps";
import { Alert, Spin } from "antd";
import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllLandmark } from "../api/hooks/useGetAllLandmark";
import ClusteredLocationMarkers from "../component/google-maps/ClusteredLocationMarkers";
import { Button } from "../component/ui/button";
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
                                    <div className="h-8 w-[68px] absolute -bottom-8 left-1/2 -translate-x-1/2 rotate-180 bg-[rgba(0,0,0,0.8)] [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)]" />

                                    <div className="max-h-96 !p-5 !space-y-7 overflow-auto">
                                        <div className="text-[15px] font-bold grid grid-cols-2 items-center [&>*:nth-child(even)]:text-right">
                                            <p>Market Block</p>
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={close}
                                                    className="p-0 h-auto w-auto cursor-pointer text-white"
                                                    variant={"link"}
                                                >
                                                    <X strokeWidth={3} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-[13px] grid grid-cols-2 items-center [&>*:nth-child(even)]:text-right gap-y-[5px]">
                                            <p>FLOOR PLAN</p>
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={() => {
                                                        navigate(
                                                            `/floor-plan?id=${e.id}&name=${e.name}`
                                                        );
                                                    }}
                                                    className="p-0 h-auto w-auto cursor-pointer text-white"
                                                    variant={"link"}
                                                >
                                                    <Eye />
                                                </Button>
                                            </div>

                                            {Object.entries(e).map(
                                                ([key, value]) =>
                                                    key !== "__typename" && (
                                                        <>
                                                            <p>{key.toUpperCase()}</p>
                                                            <p className="uppercase">{value}</p>
                                                        </>
                                                    )
                                            )}
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
