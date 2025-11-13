import { CheckCircleFilled, MoreOutlined } from "@ant-design/icons";
import {
    Button as ButtonAntd,
    Col,
    Dropdown,
    message,
    Modal,
    Row,
    Select,
    type MenuProps,
} from "antd";
import { ArrowLeft } from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeleteFloor } from "../../api/hooks/useDeleteFloor";
import { useGetFloorByLevelId } from "../../api/hooks/useGetFloorByLevelId";
import { useGetLandmarkById } from "../../api/hooks/useGetLandmarkById";
import { TOOL } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import { Button } from "../ui/button";
import FloorPlandEditor from "./FloorPlanEditor";
import StallInformation from "./StallInformation";

interface FloorOption {
    value: string;
    label: string;
}

const FloorPlanModal = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { handleGetLandmarkById, loading: loadingGetLandmarkById } = useGetLandmarkById();
    const { handleGetFloorByLevelId, loading: loadingGetFloorByLevelId } = useGetFloorByLevelId();
    const { handleDeleteFloor } = useDeleteFloor();
    const { modal, drawer } = useContext(DrawerVisibilityContext);
    const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [highlightMarkers, setHighlightMarkers] = useState(modal.showAllMarks.visible);
    const loading = loadingGetLandmarkById || loadingGetFloorByLevelId;

    const items: MenuProps["items"] = [
        {
            key: "add",
            label: "Add",
            onClick: () => {
                drawer.add.setVisible(true);
            },
        },
        {
            key: "edit",
            label: "Edit",
            onClick: () => {
                drawer.edit.setVisible(true);
            },
            disabled: !modal.selectedFloorLevelId.value,
        },
        {
            key: "delete",
            label: "Delete",
            onClick: () => {
                modalAntd.confirm({
                    title: "Confirm Deletion",
                    content: (
                        <>
                            <p>Are you sure you want to delete this floor?</p>
                            <p>This action cannot be undone.</p>
                        </>
                    ),
                    onOk: async () => {
                        try {
                            if (!id || !modal.dataSet.value?.id) {
                                return;
                            }

                            const resp = await handleDeleteFloor({
                                landmarkId: id,
                                id: modal.dataSet.value?.id,
                            });

                            if (!resp) {
                                throw new Error("Failed to delete Floor!");
                            }

                            messageApi.open({
                                type: "success",
                                icon: <CheckCircleFilled />,
                                content: "Floor was deleted successfully!",
                            });
                            drawer.refetch.setValue((prev) => !prev);
                            modal.edit.setVisible(false);
                            modal.selectedTool.setValue(TOOL.SELECT);
                            modal.form.dataSet.resetFields();
                            modal.selectedArea.setValue(null);
                            modal.dataSet.setValue(null);
                            modal.originalDataSet.setValue(null);
                            return;
                        } catch (error) {
                            messageApi.open({
                                type: "error",
                                content: "Something went wrong!",
                            });
                        }
                    },
                    okText: "DELETE",
                    okType: "danger",
                });
            },
            disabled: !modal.selectedFloorLevelId.value,
        },
    ];

    useEffect(() => {
        let isMounted = true; // flag for mount state

        const fetch = async () => {
            if (!id) {
                return;
            }
            setModalLoading(true);

            try {
                const resp = await handleGetLandmarkById(id);

                if (!resp) {
                    throw new Error("Failed to get Landmark!");
                }

                if (!isMounted) {
                    return;
                }

                const options = resp.data.getLandmarkById.floors?.map(({ id, level }: any) => ({
                    value: id,
                    label: level,
                }));

                if (isMounted) {
                    setFloorOptions(options ?? []);
                }

                if (options.length > 0) {
                    const firstFloorId = options[0].value;

                    if (isMounted) {
                        modal.selectedFloorLevelId.setValue(firstFloorId);
                    }

                    const resp = await handleGetFloorByLevelId({
                        floorId: firstFloorId,
                    });

                    if (!resp) {
                        throw new Error("Failed to get Floor!");
                    }

                    if (isMounted) {
                        modal.dataSet.setValue(resp.data.getFloorByLevelId);
                        modal.originalDataSet.setValue(resp.data.getFloorByLevelId);
                    }
                } else {
                    if (isMounted) {
                        modal.selectedFloorLevelId.setValue(undefined);
                        modal.dataSet.setValue(null);
                    }
                }
            } catch (err: any) {
                if (!isMounted) {
                    return;
                }

                // Ignore AbortErrors safely
                if (err.name === "AbortError") {
                    return;
                }

                messageApi.open({
                    type: "error",
                    content: err.message || "Failed to get Landmark!",
                });
            } finally {
                if (isMounted) {
                    setModalLoading(false);
                }
            }
        };

        fetch();

        return () => {
            // prevent state updates after unmount
            isMounted = false;
        };
    }, [id, drawer.refetch.value]);

    const onChangeSelect = useCallback(
        async (val: any) => {
            if (!val) {
                return;
            }

            modal.edit.setVisible(false);
            modal.selectedArea.setValue(null);
            modal.form.dataSet.resetFields();
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);

            modal.selectedFloorLevelId.setValue(val);

            if (id) {
                const resp = await handleGetFloorByLevelId({
                    floorId: val,
                });

                if (resp) {
                    modal.dataSet.setValue(resp.data.getFloorByLevelId);
                    modal.originalDataSet.setValue(resp.data.getFloorByLevelId);
                }
            }
        },
        [id]
    );

    const onClose = () => {
        if (!modal.selectedFloorLevelId.value || !modal.edit.visible) {
            navigate("/");
            return;
        }

        modalAntd.confirm({
            title: "Confirm Discard",
            content: (
                <>
                    <p>Are you sure you want to discard changes?</p>
                    <p>This action cannot be undone.</p>
                </>
            ),
            onOk: () => {
                navigate("/");
            },
            okText: "YES",
        });
    };

    return (
        <>
            {contextHolderMessage}
            {contextHolderModal}
            <div className="min-h-screen !p-6 !space-y-6">
                <Row gutter={[16, 24]}>
                    <Col span={17}>
                        <div className="h-full flex items-center gap-x-6">
                            <Button
                                onClick={onClose}
                                className="h-auto w-auto !p-2 text-white bg-black rounded-[100%] cursor-pointer hover:opacity-80"
                                variant={"link"}
                            >
                                <ArrowLeft strokeWidth={3} />
                            </Button>
                            <p className="font-bold text-xl uppercase">Floor Plan</p>
                        </div>
                    </Col>
                    <Col span={7}>
                        <div className="h-full flex items-center gap-x-4">
                            <Select
                                placeholder="Select Floor Level"
                                value={modal.selectedFloorLevelId.value}
                                onChange={onChangeSelect}
                                options={floorOptions}
                            />
                            <Dropdown
                                menu={{ items }}
                                placement="bottom"
                                trigger={["click"]}
                                overlayClassName="!min-w-40"
                            >
                                <ButtonAntd type="text">
                                    <MoreOutlined style={{ fontSize: 30, strokeWidth: 10 }} />
                                </ButtonAntd>
                            </Dropdown>
                        </div>
                    </Col>
                    <Col span={17}>
                        <FloorPlandEditor
                            loading={loading}
                            highlightMarkers={highlightMarkers}
                            setHighlightMarkers={setHighlightMarkers}
                        />
                    </Col>
                    <Col span={7}>
                        <StallInformation
                            loading={loading}
                            setHighlightMarkers={setHighlightMarkers}
                        />
                    </Col>
                </Row>
            </div>
        </>
    );
};
export default FloorPlanModal;
