import { EyeOutlined } from "@ant-design/icons";
import { Map } from "@vis.gl/react-google-maps";
import { Alert, Button, Form, Spin } from "antd";
import { useState } from "react";
import { useGetAllLandmark } from "../api/hooks/useGetAllLandmark";
import FloorDrawer from "../component/floor-plan/FloorDrawer";
import FloorPlanModal from "../component/floor-plan/FloorPlanModal";
import ClusteredLocationMarkers from "../component/google-maps/ClusteredLocationMarkers";
import { MANILA_POSITION } from "../constant";
import useDrawerVisibility from "../hook/useDrawerVisibility";
import { DrawerVisibilityProvider } from "../store/context/DrawerVisibilityContext";
import type { IFloor, IFloorPlanArea, ITool } from "../types/floorPlan";

const Home = () => {
    const modal = useDrawerVisibility();
    const drawer = useDrawerVisibility();
    const { data, loading, error } = useGetAllLandmark();
    const [selectedTool, setSelectedTool] = useState<ITool>("select");
    const [selectedArea, setSelectedArea] = useState<IFloorPlanArea | undefined | null>(undefined);
    const [selectedFloorLevelId, setSelectedFloorLevelId] = useState<string | undefined>(undefined);
    const [refetch, setRefetch] = useState(false);
    const [originalDataSet, setOriginalDataSet] = useState<any>(null);
    const [modalDataSet, setModalDataSet] = useState<IFloor | undefined | null>(undefined);
    const [drawerDataSet, setDrawerDataSet] = useState<any>(undefined);
    const [isShowAllMarksVisible, setIsShowAllMarksVisible] = useState(false);
    const [dataSetInfo, setDataSetInfo] = useState<any>();

    return (
        <>
            <DrawerVisibilityProvider
                value={{
                    modal: {
                        ...modal,
                        dataSet: { value: modalDataSet, setValue: setModalDataSet },
                        originalDataSet: { value: originalDataSet, setValue: setOriginalDataSet },
                        selectedTool: { value: selectedTool, setValue: setSelectedTool },
                        selectedArea: {
                            value: selectedArea,
                            setValue: setSelectedArea,
                        },
                        selectedFloorLevelId: {
                            value: selectedFloorLevelId,
                            setValue: setSelectedFloorLevelId,
                        },
                        showAllMarks: {
                            visible: isShowAllMarksVisible,
                            setVisible: setIsShowAllMarksVisible,
                        },
                        form: {
                            dataSet: Form.useForm()[0],
                            dataSetInfo: Form.useForm()[0],
                        },
                        dataSetInfo: { value: dataSetInfo, setValue: setDataSetInfo },
                    },
                    drawer: {
                        ...drawer,
                        dataSet: { value: drawerDataSet, setValue: setDrawerDataSet },
                        refetch: { value: refetch, setValue: setRefetch },
                    },
                }}
            >
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
                                                modal.view.setVisible(true);
                                                modal.id.setValue(e.id);
                                                drawer.id.setValue(e.id);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    </Map>
                </div>
                <FloorPlanModal />
                <FloorDrawer />
            </DrawerVisibilityProvider>
        </>
    );
};

export default Home;
