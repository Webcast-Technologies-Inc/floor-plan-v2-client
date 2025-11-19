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
    const floorModal = useDrawerVisibility();
    const [selectedTool, setSelectedTool] = useState<ITool>(TOOL.SELECT);
    const [selectedMarker, setSelectedMarker] = useState<IFloorPlanArea | undefined | null>(
        undefined
    );
    const [selectedFloorLevelId, setSelectedFloorLevelId] = useState<string | undefined>(undefined);
    const [refetch, setRefetch] = useState(false);
    const [originalDataset, setOriginalDataset] = useState<any>(null);
    const [modalDataset, setModalDataset] = useState<IFloor | undefined | null>(undefined);
    const [drawerDataset, setDrawerDataset] = useState<any>(undefined);
    const [isShowAllMarksVisible, setIsShowAllMarksVisible] = useState(true);
    const [stallInfoDataset, setStallInfoDataset] = useState<any>();
    const [datasetFilter, setDatasetFilter] = useState<any[] | undefined | null>();
    const [newlyAddedMarker, setNewlyAddedMarker] = useState<IFloorPlanArea | undefined | null>(
        undefined
    );

    return (
        <DrawerVisibilityProvider
            value={{
                filterModal: {
                    ...filterModal,
                    dataSet: { value: datasetFilter, setValue: setDatasetFilter },
                    form: Form.useForm()[0],
                },
                floorPlanPage: {
                    ...modal,
                    dataset: { value: modalDataset, setValue: setModalDataset },
                    originalDataset: { value: originalDataset, setValue: setOriginalDataset },
                    stallInfoDataset: { value: stallInfoDataset, setValue: setStallInfoDataset },
                    selectedTool: { value: selectedTool, setValue: setSelectedTool },
                    selectedMarker: {
                        value: selectedMarker,
                        setValue: setSelectedMarker,
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
                        datasetId: Form.useForm()[0],
                        stallInfo: Form.useForm()[0],
                    },
                    newlyAddedMarker: {
                        value: newlyAddedMarker,
                        setValue: setNewlyAddedMarker,
                    },
                },
                floorModal: {
                    ...floorModal,
                    dataSet: { value: drawerDataset, setValue: setDrawerDataset },
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
