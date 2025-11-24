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
    const [floorPlanUnmodifiedCopyDataset, setFloorPlanUnmodifiedCopyDataset] = useState<any>(null);
    const [floorPlanDataset, setFloorPlanDataset] = useState<IFloor | undefined | null>(undefined);
    const [floorDataset, setFloorDataset] = useState<any>(undefined);
    const [stallInfoDataset, setStallInfoDataset] = useState<any>();
    const [filterDataset, setFilterDataset] = useState<any[] | undefined | null>();
    const [newlyAddedMarker, setNewlyAddedMarker] = useState<IFloorPlanArea | undefined | null>(
        undefined
    );

    return (
        <DrawerVisibilityProvider
            value={{
                filterModal: {
                    ...filterModal,
                    dataSet: { value: filterDataset, setValue: setFilterDataset },
                    form: Form.useForm()[0],
                },
                floorPlanPage: {
                    ...modal,
                    dataset: {
                        floorPlan: {
                            value: floorPlanDataset,
                            setValue: setFloorPlanDataset,
                        },
                        floorPlanUnmodifiedCopy: {
                            value: floorPlanUnmodifiedCopyDataset,
                            setValue: setFloorPlanUnmodifiedCopyDataset,
                        },
                        stallInfo: { value: stallInfoDataset, setValue: setStallInfoDataset },
                    },
                    selectedTool: { value: selectedTool, setValue: setSelectedTool },
                    selectedMarker: {
                        value: selectedMarker,
                        setValue: setSelectedMarker,
                    },
                    selectedFloorLevelId: {
                        value: selectedFloorLevelId,
                        setValue: setSelectedFloorLevelId,
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
                    dataSet: { value: floorDataset, setValue: setFloorDataset },
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
