import {
    CheckCircleFilled,
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { Button, Col, Dropdown, message, Modal, Row, Select, type MenuProps } from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDeleteFloor } from "../../api/hooks/useDeleteFloor";
import { useGetFloorByLevelId } from "../../api/hooks/useGetFloorByLevelId";
import { useGetLandmarkById } from "../../api/hooks/useGetLandmarkById";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import AreaDetails from "./AreaDetails";
import DatasetInfoDetails from "./DatasetInfoDetails";
import FloorPlandEditor from "./FloorPlanEditor";

interface FloorOption {
    value: string;
    label: string;
}

const FloorPlanModal = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { handleGetLandmarkById, loading: loadingGetLandmarkById } = useGetLandmarkById();
    const { handleGetFloorByLevelId, loading: loadingGetFloorByLevelId } = useGetFloorByLevelId();
    const { handleDeleteFloor } = useDeleteFloor();
    const { modal, drawer } = useContext(DrawerVisibilityContext);
    const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const loading = loadingGetLandmarkById || loadingGetFloorByLevelId;

    const items: MenuProps["items"] = [
        {
            key: "add",
            label: "Add",
            onClick: () => {
                drawer.add.setVisible(true);
            },
            icon: <PlusOutlined className="!text-blue-500" />,
        },
        {
            key: "edit",
            label: "Edit",
            onClick: () => {
                drawer.edit.setVisible(true);
            },
            icon: <EditOutlined className="!text-blue-500" />,
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
                            modal.selectedTool.setValue("select");
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
            icon: <DeleteOutlined className="!text-red-500" />,
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

    const handleResetStates = () => {
        modal.edit.setVisible(false);
        modal.selectedArea.setValue(null);
        modal.selectedTool.setValue("select");
        modal.dataSet.setValue(null);
        modal.originalDataSet.setValue(null);
        modal.form.dataSet.resetFields();
        modal.form.dataSetInfo.resetFields();
        modal.dataSetInfo.setValue(null);
    };

    const onClose = () => {
        if (!modal.selectedFloorLevelId.value || !modal.edit.visible) {
            handleResetStates();
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
                handleResetStates();
            },
            okText: "YES",
        });
    };

    return (
        <>
            {contextHolderMessage}
            {contextHolderModal}
            {/* <Modal
                title="Floor Plan"
                width={1500}
                zIndex={500}
                onCancel={onClose}
                footer={null}
                destroyOnHidden // force re-mount to reset the states
                loading={modalLoading}
            > */}
            <Row gutter={16}>
                <Col span={17}>
                    <FloorPlandEditor loading={loading} />
                </Col>
                <Col span={7}>
                    <div className="!space-y-4">
                        <div className="flex gap-x-4">
                            <Select
                                placeholder="Select Floor Level"
                                style={{ width: 160 }}
                                value={modal.selectedFloorLevelId.value}
                                onChange={onChangeSelect}
                                options={floorOptions}
                            />
                            <Dropdown
                                menu={{
                                    items: modal.selectedFloorLevelId.value
                                        ? items
                                        : items.filter((item) => item?.key === "add"),
                                }}
                                placement="bottom"
                            >
                                <Button type="primary">
                                    Floor Actions
                                    <DownOutlined />
                                </Button>
                            </Dropdown>
                        </div>
                        {modal.edit.visible ? (
                            <AreaDetails loading={loading} />
                        ) : (
                            <DatasetInfoDetails />
                        )}
                    </div>
                </Col>
            </Row>
            {/* </Modal> */}
        </>
    );
};
export default FloorPlanModal;
