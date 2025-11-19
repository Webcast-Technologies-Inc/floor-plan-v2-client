import { Form } from "antd";
import { useState } from "react";
import FloorDrawer from "../component/floor-plan/FloorDrawer";
import FloorPlanModal from "../component/floor-plan/FloorPlanModal";
import MarkerFilterModal from "../component/floor-plan/MarkerFilterModal";
import { TOOL } from "../constant";
import useDrawerVisibility from "../hook/useDrawerVisibility";
import { DrawerVisibilityProvider } from "../store/context/DrawerVisibilityContext";
import type { IFloor, IFloorPlanArea, ITool } from "../types/floorPlan";

const FloorPlan = () => {
    const modal = useDrawerVisibility();
    const filterModal = useDrawerVisibility();
    const drawer = useDrawerVisibility();
    const [selectedTool, setSelectedTool] = useState<ITool>(TOOL.SELECT);
    const [selectedArea, setSelectedArea] = useState<IFloorPlanArea | undefined | null>(undefined);
    const [selectedFloorLevelId, setSelectedFloorLevelId] = useState<string | undefined>(undefined);
    const [refetch, setRefetch] = useState(false);
    const [originalDataSet, setOriginalDataSet] = useState<any>(null);
    const [modalDataSet, setModalDataSet] = useState<IFloor | undefined | null>(undefined);
    const [drawerDataSet, setDrawerDataSet] = useState<any>(undefined);
    const [isShowAllMarksVisible, setIsShowAllMarksVisible] = useState(true);
    const [dataSetInfo, setDataSetInfo] = useState<any>();
    const [dataSetFilter, setDataSetFilter] = useState<any[] | undefined | null>();
    const [recentlyCreatedMarker, setRecentlyCreatedMarker] = useState<
        IFloorPlanArea | undefined | null
    >(undefined);

    return (
        <DrawerVisibilityProvider
            value={{
                filterModal: {
                    ...filterModal,
                    dataSet: { value: dataSetFilter, setValue: setDataSetFilter },
                    form: Form.useForm()[0],
                },
                floorPlanPage: {
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
                    stallInfoDataset: { value: dataSetInfo, setValue: setDataSetInfo },
                    recentlyCreatedMarker: {
                        value: recentlyCreatedMarker,
                        setValue: setRecentlyCreatedMarker,
                    },
                },
                drawer: {
                    ...drawer,
                    dataSet: { value: drawerDataSet, setValue: setDrawerDataSet },
                    refetch: { value: refetch, setValue: setRefetch },
                },
            }}
        >
            <FloorPlanModal />
            <MarkerFilterModal />
            <FloorDrawer />
        </DrawerVisibilityProvider>
    );
};

export default FloorPlan;
