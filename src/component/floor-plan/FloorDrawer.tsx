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
    const { floorPlanPage, filterModal, floorModal } = useContext(DrawerVisibilityContext);
    const { handleGetDatasets, loading: loadingGetDatasets } = useGetDatasets();
    const { handleCreateFloor } = useCreateFloor();
    const { handleGetFloorByLevelId, loading: loadingGetFloorByLevelId } = useGetFloorByLevelId();
    const { handleUpdateFloor } = useUpdateFloor();
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (id && floorModal.edit.visible && floorPlanPage.selectedFloorLevelId.value) {
                try {
                    const resp = await handleGetFloorByLevelId({
                        floorId: floorPlanPage.selectedFloorLevelId.value,
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

            if (floorModal.add.visible || floorModal.edit.visible) {
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
        id,
        floorModal.add.visible,
        floorModal.edit.visible,
        floorPlanPage.selectedFloorLevelId.value,
    ]);

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

            if (id && floorModal.add.visible && file) {
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
                        floorModal.refetch.setValue((prev) => !prev);
                        floorModal.add.setVisible(false);
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

            if (id && floorModal.edit.visible && file) {
                try {
                    if (!floorPlanPage.selectedFloorLevelId.value) {
                        return;
                    }

                    const resp = await handleUpdateFloor({
                        ...payload,
                        landmarkId: id,
                        id: floorPlanPage.selectedFloorLevelId.value,
                        ...(modifiedFile as any),
                    });

                    if (resp) {
                        messageApi.open({
                            type: "success",
                            content: "Floor updated successfully!",
                        });
                        if (
                            floorPlanPage.dataset.floorPlan.value?.dataSetId !== payload.dataSetId
                        ) {
                            /* Clear filter if the dataset was changed */
                            filterModal.dataSet.setValue(null);
                            filterModal.form.resetFields();
                        }
                        floorModal.refetch.setValue((prev) => !prev);
                        floorModal.edit.setVisible(false);
                        floorPlanPage.selectedMarker.setValue(null);
                        floorPlanPage.form.stallInfo.resetFields();
                        floorPlanPage.stallInfoDataset.setValue(null);
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
        [
            id,
            floorModal.add.visible,
            floorModal.edit.visible,
            floorPlanPage.selectedFloorLevelId.value,
        ]
    );

    const onClose = useCallback(() => {
        floorModal.view.setVisible(false);
        floorModal.add.setVisible(false);
        floorModal.edit.setVisible(false);
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
                    floorModal.add.visible
                        ? "Add Floor"
                        : floorModal.view.visible
                        ? "View Floor"
                        : floorModal.edit.visible
                        ? "Edit Floor"
                        : ""
                }
                width={600}
                zIndex={1000}
                onCancel={onCloseForm}
                open={floorModal.add.visible || floorModal.view.visible || floorModal.edit.visible}
                footer={
                    <>
                        {(floorModal.add.visible || floorModal.edit.visible) && (
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
                            disabled={floorModal.view.visible}
                        >
                            {(floorModal.add.visible || floorModal.edit.visible) && (
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
