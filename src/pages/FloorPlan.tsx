import { Card, Form } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FloorDrawer from "../component/floor-plan/FloorDrawer";
import FloorPlanModal from "../component/floor-plan/FloorPlanModal";
import MarkerFilterModal from "../component/floor-plan/MarkerFilterModal";
import useDrawerVisibility from "../hook/useDrawerVisibility";
import { DrawerVisibilityProvider } from "../store/context/DrawerVisibilityContext";
import type { IFloor, IFloorPlanArea, ITool } from "../types/floorPlan";

const FloorPlan = () => {
    const [searchParams] = useSearchParams();
    const modal = useDrawerVisibility();
    const filterModal = useDrawerVisibility();
    const drawer = useDrawerVisibility();
    const [selectedTool, setSelectedTool] = useState<ITool>("select");
    const [selectedArea, setSelectedArea] = useState<IFloorPlanArea | undefined | null>(undefined);
    const [selectedFloorLevelId, setSelectedFloorLevelId] = useState<string | undefined>(undefined);
    const [refetch, setRefetch] = useState(false);
    const [originalDataSet, setOriginalDataSet] = useState<any>(null);
    const [modalDataSet, setModalDataSet] = useState<IFloor | undefined | null>(undefined);
    const [drawerDataSet, setDrawerDataSet] = useState<any>(undefined);
    const [isShowAllMarksVisible, setIsShowAllMarksVisible] = useState(false);
    const [dataSetInfo, setDataSetInfo] = useState<any>();
    const [dataSetFilter, setDataSetFilter] = useState<any[] | undefined | null>();
    const id = searchParams.get("id");

    useEffect(() => {
        if (id) {
            modal.id.setValue(id);
            drawer.id.setValue(id);
        }
    }, [id]);

    return (
        <DrawerVisibilityProvider
            value={{
                filterModal: {
                    ...filterModal,
                    dataSet: { value: dataSetFilter, setValue: setDataSetFilter },
                    form: Form.useForm()[0],
                },
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
            <Card title="Floor Plan" variant="outlined" style={{ width: "100%" }}>
                <FloorPlanModal />
            </Card>
            <MarkerFilterModal />
            <FloorDrawer />
        </DrawerVisibilityProvider>
    );
};

export default FloorPlan;
