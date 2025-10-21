import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, message, Modal, Select, Space, type FormProps } from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { useCreateFloor } from "../../api/hooks/useCreateFloor";
import { useGetDatasets } from "../../api/hooks/useGetDatasets";
import { useGetFloorByLevelId } from "../../api/hooks/useGetFloorByLevelId";
import { useUpdateFloor } from "../../api/hooks/useUpdateFloor";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";

interface FieldType {
    id?: string;
    name: string;
    level: string;
    dataSetId: string;
}

const FloorDrawer = () => {
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [form] = Form.useForm();
    const { modal, drawer } = useContext(DrawerVisibilityContext);
    const { handleGetDatasets } = useGetDatasets();
    const { handleCreateFloor, loading: loadingCreateFloor } = useCreateFloor();
    const { handleGetFloorByLevelId, loading: loadingGetFloorByLevelId } = useGetFloorByLevelId();
    const { handleUpdateFloor, loading: loadingUpdateFloor } = useUpdateFloor();
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        const fetch = async () => {
            if (
                drawer.edit.visible &&
                modal.id.value &&
                drawer.id.value &&
                modal.selectedFloorLevelId.value
            ) {
                try {
                    const resp = await handleGetFloorByLevelId({
                        floorId: modal.selectedFloorLevelId.value,
                    });

                    if (!resp) {
                        throw new Error("Failed to fetch floor data");
                    }

                    form.setFieldsValue({
                        ...resp.data.getFloorByLevelId,
                    });
                } catch (error) {
                    messageApi.open({
                        type: "error",
                        content: "Something went wrong!",
                    });
                }
            }

            if (drawer.add.visible || drawer.edit.visible) {
                const datasets = await handleGetDatasets({
                    args: {},
                });

                setOptions(
                    datasets.data?.get_datasets.datasets.map((dataset: any) => ({
                        value: dataset.id,
                        label: dataset.alias,
                    })) || []
                );
            }
        };
        fetch();
    }, [
        drawer.add.visible,
        drawer.edit.visible,
        modal.id.value,
        drawer.id.value,
        modal.selectedFloorLevelId.value,
    ]);

    const onClickSubmit = useCallback(() => {
        form.submit();
    }, [form]);

    const onFinish: FormProps<FieldType>["onFinish"] = useCallback(
        async (values: FieldType) => {
            if (drawer.add.visible && modal.id.value) {
                try {
                    const resp = await handleCreateFloor({ landmarkId: modal.id.value, ...values });

                    if (resp) {
                        messageApi.open({
                            type: "success",
                            content: "Floor added successfully!",
                        });
                        drawer.refetch.setValue((prev) => !prev);
                        drawer.add.setVisible(false);
                    }
                } catch (err) {
                    messageApi.open({
                        type: "error",
                        content: "Failed to add Floor!",
                    });
                }
            }

            if (drawer.edit.visible && modal.id.value) {
                try {
                    if (!modal.selectedFloorLevelId.value) {
                        return;
                    }

                    const resp = await handleUpdateFloor({
                        landmarkId: modal.id.value,
                        id: modal.selectedFloorLevelId.value,
                        ...values,
                    });

                    if (resp) {
                        messageApi.open({
                            type: "success",
                            content: "Floor updated successfully!",
                        });
                        drawer.refetch.setValue((prev) => !prev);
                        drawer.edit.setVisible(false);
                        modal.selectedArea.setValue(null);
                        modal.form.dataSetInfo.resetFields();
                        modal.dataSetInfo.setValue(null);
                    }
                } catch (err) {
                    messageApi.open({
                        type: "error",
                        content: "Failed to update Floor!",
                    });
                }
            }
        },
        [
            drawer.add.visible,
            drawer.edit.visible,
            drawer.id.value,
            modal.id.value,
            modal.selectedFloorLevelId.value,
        ]
    );

    const onClose = useCallback(() => {
        drawer.view.setVisible(false);
        drawer.add.setVisible(false);
        drawer.edit.setVisible(false);
    }, []);

    const onCloseForm = useCallback(() => {
        if (form.isFieldsTouched()) {
            modalAntd.confirm({
                title: "Confirm Discard",
                content: (
                    <>
                        <p>Are you sure you want to discard changes?</p>
                        <p>This action cannot be undone.</p>
                    </>
                ),
                onOk: () => {
                    onClose();
                },
                okText: "YES",
            });
        } else {
            onClose();
        }
    }, [form, modalAntd, onClose]);

    return (
        <>
            {contextHolderModal}
            {contextHolderMessage}
            <Drawer
                title={
                    drawer.add.visible
                        ? "Add Floor"
                        : drawer.view.visible
                        ? "View Floor"
                        : drawer.edit.visible
                        ? "Edit Floor"
                        : ""
                }
                width={600}
                zIndex={1000}
                onClose={onCloseForm}
                open={drawer.add.visible || drawer.view.visible || drawer.edit.visible}
                extra={
                    <Space>
                        {(drawer.add.visible || drawer.edit.visible) && (
                            <Button
                                onClick={onClickSubmit}
                                type="primary"
                                icon={
                                    drawer.add.visible ? (
                                        <PlusOutlined />
                                    ) : drawer.edit.visible ? (
                                        <SaveOutlined />
                                    ) : (
                                        ""
                                    )
                                }
                                loading={loadingCreateFloor || loadingUpdateFloor}
                            >
                                {drawer.add.visible ? "Add" : drawer.edit.visible ? "Save" : ""}
                            </Button>
                        )}
                    </Space>
                }
                afterOpenChange={(open) => {
                    if (!open) {
                        form.resetFields();
                    }
                }}
                loading={loadingGetFloorByLevelId}
            >
                <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Name is required" }]}
                    >
                        <Input allowClear />
                    </Form.Item>

                    <Form.Item
                        label="Floor Level"
                        name="level"
                        rules={[{ required: true, message: "Floor is required" }]}
                    >
                        <Input allowClear />
                    </Form.Item>

                    <Form.Item
                        label="Dataset"
                        name="dataSetId"
                        rules={[{ required: true, message: "Dataset is required" }]}
                    >
                        <Select
                            showSearch
                            style={{ width: 200 }}
                            placeholder="Search to Select"
                            optionFilterProp="label"
                            filterSort={(optionA, optionB) =>
                                (optionA?.label ?? "")
                                    .toLowerCase()
                                    .localeCompare((optionB?.label ?? "").toLowerCase())
                            }
                            options={options}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </>
    );
};

export default FloorDrawer;
