import { DeleteOutlined, DownOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Dropdown, message, Modal, Row, Select, type MenuProps } from "antd";
import { useContext } from "react";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import AreaDetails from "./card/AreaDetails";
import FloorPlandEditor from "./card/FloorPlanEditor";

const FloorPlanModal = () => {
    const { modal, drawer } = useContext(DrawerVisibilityContext);
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();

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
                        // try {
                        //     if (!modal.id.value) {
                        //         return;
                        //     }
                        //     const resp = await handleDeleteFloor({
                        //         landmarkId: modal.id.value,
                        //         id: modal.dataSet.value?.id,
                        //     });
                        //     if (!resp) {
                        //         throw new Error("Failed to delete Floor!");
                        //     }
                        //     messageApi.open({
                        //         type: "success",
                        //         icon: <CheckCircleFilled />,
                        //         content: "Floor was deleted successfully!",
                        //     });
                        //     drawer.refetch.setValue((prev) => !prev);
                        //     modal.edit.setVisible(false);
                        //     modal.selectedTool.setValue("select");
                        //     modal.form.resetFields();
                        //     return;
                        // } catch (error) {
                        //     messageApi.open({
                        //         type: "error",
                        //         content: "Something went wrong!",
                        //     });
                        // }
                    },
                    okText: "DELETE",
                    okType: "danger",
                });
            },
            icon: <DeleteOutlined className="!text-red-500" />,
        },
    ];

    const onClose = () => {
        // if (!modal.selectedFloorLevelId.value || !modal.edit.visible) {
        //     handleResetStates();
        //     return;
        // }

        // modalAntd.confirm({
        //     title: "Confirm Discard",
        //     content: (
        //         <>
        //             <p>Are you sure you want to discard changes?</p>
        //             <p>This action cannot be undone.</p>
        //         </>
        //     ),
        //     onOk: () => {
        //         handleResetStates();
        //     },
        //     okText: "YES",
        // });
        modal.view.setVisible(false);
    };

    return (
        <>
            {contextHolderMessage}
            {contextHolderModal}
            <Modal
                title="Floor Plan"
                width={1500}
                zIndex={500}
                open={modal.view.visible}
                onCancel={onClose}
                footer={null}
                destroyOnHidden // force re-mount to reset the states
            >
                <Row gutter={16}>
                    <Col span={17}>
                        <FloorPlandEditor />
                    </Col>
                    <Col span={7}>
                        <div className="!space-y-4">
                            <div className="flex gap-x-4">
                                <Select
                                    placeholder="Select Floor Level"
                                    style={{ width: 160 }}
                                    // value={modal.selectedFloorLevelId.value}
                                    // onChange={onChangeSelect}
                                    options={[
                                        { value: "jack", label: "Jack" },
                                        { value: "lucy", label: "Lucy" },
                                        { value: "Yiminghe", label: "yiminghe" },
                                        { value: "disabled", label: "Disabled", disabled: true },
                                    ]}
                                />
                                <Dropdown menu={{ items }} placement="bottom">
                                    <Button type="primary">
                                        Floor Actions
                                        <DownOutlined />
                                    </Button>
                                </Dropdown>
                            </div>
                            <AreaDetails />
                        </div>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};
export default FloorPlanModal;
