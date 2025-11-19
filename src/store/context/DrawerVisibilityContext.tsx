import type { FormInstance } from "antd";
import { createContext } from "react";
import type { IFloor, IFloorPlanArea } from "../../types/floorPlan";

interface DrawerState {
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IdState {
    value: string | null | undefined;
    setValue: React.Dispatch<React.SetStateAction<string | null | undefined>>;
}

interface DataState {
    value: any;
    setValue: React.Dispatch<React.SetStateAction<any>>;
}

interface IModalVisibility {
    add: DrawerState;
    edit: DrawerState;
    remove: DrawerState;
    view: DrawerState;
    id: IdState;
}

interface DrawerContextType {
    floorPlanPage: IModalVisibility & {
        dataset: {
            value: IFloor | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloor | undefined | null>>;
        };
        originalDataset: {
            value: IFloor | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloor | undefined | null>>;
        };
        stallInfoDataset: {
            value: any | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<any | undefined | null>>;
        };
        selectedTool: DataState;
        selectedMarker: {
            value: IFloorPlanArea | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloorPlanArea | undefined | null>>;
        };
        selectedFloorLevelId: {
            value: string | undefined;
            setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
        };
        showAllMarks: DrawerState;
        form: {
            datasetId: FormInstance;
            stallInfo: FormInstance;
        };
        newlyAddedMarker: {
            value: IFloorPlanArea | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloorPlanArea | undefined | null>>;
        };
    };
    filterModal: IModalVisibility & {
        dataSet: {
            value: any[] | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<any[] | undefined | null>>;
        };
        form: FormInstance;
    };
    drawer: IModalVisibility & {
        dataSet: DataState;
        refetch: { value: boolean; setValue: React.Dispatch<React.SetStateAction<boolean>> };
    };
}

const modalVisibility: IModalVisibility = {
    add: {
        visible: false,
        setVisible: () => {},
    },
    edit: {
        visible: false,
        setVisible: () => {},
    },
    remove: {
        visible: false,
        setVisible: () => {},
    },
    view: {
        visible: false,
        setVisible: () => {},
    },
    id: {
        value: undefined,
        setValue: () => {},
    },
};

const initialState: DrawerContextType = {
    floorPlanPage: {
        ...modalVisibility,
        dataset: {
            value: undefined,
            setValue: () => {},
        },
        originalDataset: {
            value: undefined,
            setValue: () => {},
        },
        selectedTool: {
            value: undefined,
            setValue: () => {},
        },
        selectedMarker: {
            value: undefined,
            setValue: () => {},
        },
        selectedFloorLevelId: {
            value: undefined,
            setValue: () => {},
        },
        showAllMarks: {
            visible: false,
            setVisible: () => {},
        },
        form: {
            datasetId: {} as FormInstance,
            stallInfo: {} as FormInstance,
        },
        stallInfoDataset: {
            value: undefined,
            setValue: () => {},
        },
        newlyAddedMarker: {
            value: undefined,
            setValue: () => {},
        },
    },
    filterModal: {
        ...modalVisibility,
        dataSet: {
            value: undefined,
            setValue: () => {},
        },
        form: {} as FormInstance,
    },
    drawer: {
        ...modalVisibility,
        dataSet: {
            value: undefined,
            setValue: () => {},
        },
        refetch: {
            value: false,
            setValue: () => {},
        },
    },
};

const DrawerVisibilityContext = createContext<DrawerContextType>(initialState);

export const DrawerVisibilityProvider = DrawerVisibilityContext.Provider;

export default DrawerVisibilityContext;
