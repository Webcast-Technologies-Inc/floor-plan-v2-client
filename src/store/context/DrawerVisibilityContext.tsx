import type { FormInstance } from "antd";
import { createContext } from "react";
import type { IFloor, IFloorPlanArea, IMarkerFilter } from "../../types/floorPlan";

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
    modal: IModalVisibility & {
        dataSet: {
            value: IFloor | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloor | undefined | null>>;
        };
        originalDataSet: DataState;
        selectedTool: DataState;
        selectedArea: {
            value: IFloorPlanArea | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IFloorPlanArea | undefined | null>>;
        };
        selectedFloorLevelId: {
            value: string | undefined;
            setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
        };
        showAllMarks: DrawerState;
        form: {
            dataSet: FormInstance;
            dataSetInfo: FormInstance;
        };
        dataSetInfo: {
            value: any | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<any | undefined | null>>;
        };
    };
    filterModal: IModalVisibility & {
        dataSet: {
            value: IMarkerFilter[] | undefined | null;
            setValue: React.Dispatch<React.SetStateAction<IMarkerFilter[] | undefined | null>>;
        };
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
    modal: {
        ...modalVisibility,
        dataSet: {
            value: undefined,
            setValue: () => {},
        },
        originalDataSet: {
            value: undefined,
            setValue: () => {},
        },
        selectedTool: {
            value: undefined,
            setValue: () => {},
        },
        selectedArea: {
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
            dataSet: {} as FormInstance,
            dataSetInfo: {} as FormInstance,
        },
        dataSetInfo: {
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
