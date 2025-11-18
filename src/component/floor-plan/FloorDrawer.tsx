import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Select,
    Upload,
    type FormProps,
    type UploadFile,
} from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCreateFloor } from "../../api/hooks/useCreateFloor";
import { useGetDatasets } from "../../api/hooks/useGetDatasets";
import { useGetFloorByLevelId } from "../../api/hooks/useGetFloorByLevelId";
import { useUpdateFloor } from "../../api/hooks/useUpdateFloor";
import { BUCKET_NAME } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IUploadFile } from "../../types/floorPlan";
import customFileName from "../../utils/customFileName";
import { supabase } from "../../utils/supabaseClient";
interface FieldType {
    id?: string;
    name: string;
    level: string;
    dataSetId: string;
    floorPlanFile: UploadFile[];
}

const FloorDrawer = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [form] = Form.useForm();
    const { modal, filterModal, drawer } = useContext(DrawerVisibilityContext);
    const { handleGetDatasets, loading: loadingGetDatasets } = useGetDatasets();
    const { handleCreateFloor } = useCreateFloor();
    const { handleGetFloorByLevelId, loading: loadingGetFloorByLevelId } = useGetFloorByLevelId();
    const { handleUpdateFloor } = useUpdateFloor();
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (id && drawer.edit.visible && modal.selectedFloorLevelId.value) {
                try {
                    const resp = await handleGetFloorByLevelId({
                        floorId: modal.selectedFloorLevelId.value,
                    });

                    if (!resp) {
                        throw new Error("Failed to fetch floor data");
                    }

                    const { id, fileName, fileType, filePath, presignedUrl, ...restData } =
                        resp.data.getFloorByLevelId;

                    const floorPlanFile = {
                        uid: id,
                        name: fileName,
                        status: "done",
                        url: presignedUrl,
                        filePath: filePath,
                        fileType: fileType,
                    };

                    form.setFieldsValue({ ...restData, floorPlanFile: [floorPlanFile] });
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
    }, [id, drawer.add.visible, drawer.edit.visible, modal.selectedFloorLevelId.value]);

    const onClickSubmit = useCallback(() => {
        form.submit();
    }, [form]);

    const onFinish: FormProps<FieldType>["onFinish"] = useCallback(
        async (values: FieldType) => {
            setIsSubmitting(true);
            let modifiedFile: IUploadFile;

            const {
                floorPlanFile: [file],
                ...payload
            } = values;

            if (!file.originFileObj) {
                modifiedFile = {
                    fileName: file.name,
                    fileType: (file as any).fileType,
                    filePath: (file as any).filePath,
                };
            } else {
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME.documents)
                    .upload(customFileName(file.originFileObj), file.originFileObj, {
                        cacheControl: "3600",
                        upsert: true,
                    });

                if (error) {
                    messageApi.open({
                        type: "error",
                        content: "Failed to upload floor plan file!",
                    });
                    return;
                }

                modifiedFile = {
                    fileName: file.name,
                    fileType: file.type,
                    filePath: data.fullPath,
                };
            }

            if (id && drawer.add.visible && file) {
                try {
                    const resp = await handleCreateFloor({
                        ...payload,
                        landmarkId: id,
                        ...(modifiedFile as any),
                    });

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
                } finally {
                    setIsSubmitting(false);
                }
            }

            if (id && drawer.edit.visible && file) {
                try {
                    if (!modal.selectedFloorLevelId.value) {
                        return;
                    }

                    const resp = await handleUpdateFloor({
                        ...payload,
                        landmarkId: id,
                        id: modal.selectedFloorLevelId.value,
                        ...(modifiedFile as any),
                    });

                    if (resp) {
                        messageApi.open({
                            type: "success",
                            content: "Floor updated successfully!",
                        });
                        if (modal.dataSet.value?.dataSetId !== payload.dataSetId) {
                            /* Clear filter if the dataset was changed */
                            filterModal.dataSet.setValue(null);
                            filterModal.form.resetFields();
                        }
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
                } finally {
                    setIsSubmitting(false);
                }
            }
        },
        [id, drawer.add.visible, drawer.edit.visible, modal.selectedFloorLevelId.value]
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
            <Modal
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
                onCancel={onCloseForm}
                open={drawer.add.visible || drawer.view.visible || drawer.edit.visible}
                footer={
                    <>
                        {(drawer.add.visible || drawer.edit.visible) && (
                            <Button
                                style={{ width: "100%" }}
                                onClick={onClickSubmit}
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={isSubmitting}
                            >
                                Save
                            </Button>
                        )}
                    </>
                }
                afterOpenChange={(open) => {
                    if (!open) {
                        form.resetFields();
                    }
                }}
                loading={loadingGetFloorByLevelId || loadingGetDatasets}
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

                    <Form.Item
                        label="Upload Floor Plan"
                        name="floorPlanFile"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            if (Array.isArray(e)) {
                                return e;
                            }
                            return e?.fileList;
                        }}
                        rules={[{ required: true, message: "Floor Plan file is required" }]}
                    >
                        <Upload
                            fileList={form.getFieldValue("floorPlanFile") as any}
                            listType="picture"
                            beforeUpload={() => false}
                            maxCount={1}
                            multiple
                            style={{ width: "100%" }}
                            disabled={drawer.view.visible}
                        >
                            {(drawer.add.visible || drawer.edit.visible) && (
                                <Button icon={<UploadOutlined />} style={{ width: "100%" }}>
                                    Upload
                                </Button>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default FloorDrawer;
