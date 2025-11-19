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
    const { floorPlanPage, drawer } = useContext(DrawerVisibilityContext);
    const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [highlightMarkers, setHighlightMarkers] = useState(floorPlanPage.showAllMarks.visible);
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
            disabled: !floorPlanPage.selectedFloorLevelId.value,
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
                            if (!id || !floorPlanPage.dataset.value?.id) {
                                return;
                            }

                            const resp = await handleDeleteFloor({
                                landmarkId: id,
                                id: floorPlanPage.dataset.value?.id,
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
                            floorPlanPage.edit.setVisible(false);
                            floorPlanPage.selectedTool.setValue(TOOL.SELECT);
                            floorPlanPage.form.dataSet.resetFields();
                            floorPlanPage.selectedMarker.setValue(null);
                            floorPlanPage.dataset.setValue(null);
                            floorPlanPage.originalDataset.setValue(null);
                            floorPlanPage.form.dataSetInfo.resetFields();
                            floorPlanPage.form.dataSetInfo.resetFields();
                            floorPlanPage.stallInfoDataset.setValue(null);
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
            disabled: !floorPlanPage.selectedFloorLevelId.value,
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
                        floorPlanPage.selectedFloorLevelId.setValue(firstFloorId);
                    }

                    const resp = await handleGetFloorByLevelId({
                        floorId: firstFloorId,
                    });

                    if (!resp) {
                        throw new Error("Failed to get Floor!");
                    }

                    if (isMounted) {
                        floorPlanPage.dataset.setValue(resp.data.getFloorByLevelId);
                        floorPlanPage.originalDataset.setValue(resp.data.getFloorByLevelId);
                    }
                } else {
                    if (isMounted) {
                        floorPlanPage.selectedFloorLevelId.setValue(undefined);
                        floorPlanPage.dataset.setValue(null);
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

            floorPlanPage.edit.setVisible(false);
            floorPlanPage.selectedMarker.setValue(null);
            floorPlanPage.form.dataSet.resetFields();
            floorPlanPage.form.dataSetInfo.resetFields();
            floorPlanPage.stallInfoDataset.setValue(null);

            floorPlanPage.selectedFloorLevelId.setValue(val);

            if (id) {
                const resp = await handleGetFloorByLevelId({
                    floorId: val,
                });

                if (resp) {
                    floorPlanPage.dataset.setValue(resp.data.getFloorByLevelId);
                    floorPlanPage.originalDataset.setValue(resp.data.getFloorByLevelId);
                }
            }
        },
        [id]
    );

    const onClose = () => {
        if (!floorPlanPage.selectedFloorLevelId.value || !floorPlanPage.edit.visible) {
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
            <div className="min-h-screen !p-6 !space-y-6 bg-slate-50">
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
                            <p className="font-bold text-xl uppercase">
                                Floor Plan : <span className="italic">{name}</span>
                            </p>
                        </div>
                    </Col>
                    <Col span={7}>
                        <div className="h-full flex items-center gap-x-4">
                            <Select
                                placeholder="Select Floor Level"
                                value={floorPlanPage.selectedFloorLevelId.value}
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
