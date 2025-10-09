import type { FormInstance } from "antd";
import { createContext } from "react";

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

interface DrawerGroup {
    add: DrawerState;
    edit: DrawerState;
    remove: DrawerState;
    view: DrawerState;
    id: IdState;
    dataSet: DataState;
}

interface DrawerContextType {
    modal: DrawerGroup & {
        originalDataSet: DataState;
        selectedTool: DataState;
        selectedArea: DataState;
        selectedFloorLevelId: {
            value: string | undefined;
            setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
        };
        form: FormInstance;
    };
    drawer: DrawerGroup & {
        refetch: { value: boolean; setValue: React.Dispatch<React.SetStateAction<boolean>> };
    };
}

const emptyDrawerGroup: DrawerGroup = {
    add: {
        visible: false,
        setVisible: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
    },
    edit: {
        visible: false,
        setVisible: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
    },
    remove: {
        visible: false,
        setVisible: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
    },
    view: {
        visible: false,
        setVisible: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
    },
    id: {
        value: undefined,
        setValue: (() => {}) as React.Dispatch<React.SetStateAction<string | null | undefined>>,
    },
    dataSet: {
        value: undefined,
        setValue: (() => {}) as React.Dispatch<React.SetStateAction<any>>,
    },
};

const initialState: DrawerContextType = {
    modal: {
        ...emptyDrawerGroup,
        originalDataSet: {
            value: undefined,
            setValue: (() => {}) as React.Dispatch<React.SetStateAction<any>>,
        },
        selectedTool: {
            value: undefined,
            setValue: (() => {}) as React.Dispatch<React.SetStateAction<any>>,
        },
        selectedArea: {
            value: undefined,
            setValue: (() => {}) as React.Dispatch<React.SetStateAction<any>>,
        },
        selectedFloorLevelId: {
            value: undefined,
            setValue: (() => {}) as React.Dispatch<React.SetStateAction<string | undefined>>,
        },
        form: {} as FormInstance,
    },
    drawer: {
        ...emptyDrawerGroup,
        refetch: {
            value: false,
            setValue: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
        },
    },
};

const DrawerVisibilityContext = createContext<DrawerContextType>(initialState);

export const DrawerVisibilityProvider = DrawerVisibilityContext.Provider;

export default DrawerVisibilityContext;
