import { useState } from "react";

const useDrawerVisibility = () => {
    const [isAddVisible, setIsAddVisible] = useState(false);
    const [isViewVisible, setIsViewVisible] = useState(false);
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [isRemoveVisible, setIsRemoveVisible] = useState(false);
    const [id, setId] = useState<string | null | undefined>(undefined);

    return {
        add: { visible: isAddVisible, setVisible: setIsAddVisible },
        view: { visible: isViewVisible, setVisible: setIsViewVisible },
        edit: { visible: isEditVisible, setVisible: setIsEditVisible },
        remove: { visible: isRemoveVisible, setVisible: setIsRemoveVisible },
        id: { value: id, setValue: setId },
    };
};

export default useDrawerVisibility;
