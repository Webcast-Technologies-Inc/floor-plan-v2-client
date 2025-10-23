import { DeleteOutlined, FilterOutlined, PlusCircleFilled } from "@ant-design/icons";
import { Button, Divider, Form, Modal, Select } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useGetDatasetAttributeOptions } from "../../api/hooks/useGetDatasetAttributeOptions";
import { useGetDatasetHeaders } from "../../api/hooks/useGetDatasetHeaders";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";

const MarkerFilter = () => {
    const { filterModal, modal } = useContext(DrawerVisibilityContext);
    const [form] = Form.useForm();
    const { handleGetDatasetHeaders } = useGetDatasetHeaders();
    const { handleGetAttributeOptions } = useGetDatasetAttributeOptions();
    const [headerOptions, setHeaderOptions] = useState<{ value: string; label: string }[]>([]);
    const [attributeOptionsMap, setAttributeOptionsMap] = useState<
        Record<number, { value: string; label: string }[]>
    >({});

    useEffect(() => {
        const fetch = async () => {
            if (!(modal.dataSet.value?.dataSetId && filterModal.view.visible)) {
                return;
            }

            const respHeaders = await handleGetDatasetHeaders({
                getDatasetInfoHeadersId: modal.dataSet.value?.dataSetId,
            });

            const options =
                respHeaders.data?.get_dataset_info_headers.headers?.map((header) => ({
                    value: header.name,
                    label: header.name,
                })) || [];

            setHeaderOptions(options);
        };

        fetch();
    }, [filterModal.view.visible, modal.dataSet.value?.dataSetId]);

    const onClose = () => {
        filterModal.view.setVisible(false);
    };

    const onAfterClose = () => {
        form.resetFields();
        setHeaderOptions([]);
        setAttributeOptionsMap({});
    };

    const onFinish = (values: any) => {
        console.log("Form Values:", values);
    };

    return (
        <Modal
            open={filterModal.view.visible}
            title="Filter"
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="apply"
                    type="primary"
                    icon={<FilterOutlined />}
                    onClick={() => form.submit()}
                >
                    Apply
                </Button>,
            ]}
            afterClose={onAfterClose}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ filter: [{}] }}
            >
                <Form.List name="filter">
                    {(fields, { add, remove }) => (
                        <>
                            <div className="max-h-[50vh] overflow-y-auto !pr-2">
                                {fields.map(({ key, name }) => (
                                    <React.Fragment key={key}>
                                        {fields.length > 1 && (
                                            <Divider orientation="right">
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <DeleteOutlined style={{ color: "red" }} />
                                                    }
                                                    onClick={() => remove(name)}
                                                />
                                            </Divider>
                                        )}
                                        <div className="grid grid-cols-[2fr_1fr] gap-x-4">
                                            <Form.Item
                                                name={[name, "attribute"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Attribute is required",
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    options={headerOptions}
                                                    placeholder="Select Attribute"
                                                    onChange={async (value) => {
                                                        const respAttribute =
                                                            await handleGetAttributeOptions({
                                                                attributeName: value,
                                                                getDatasetAttributeOptionsId: "1",
                                                            });

                                                        const attributeOptions = (
                                                            respAttribute.data
                                                                ?.get_dataset_attribute_options
                                                                .options || []
                                                        ).map((option) => ({
                                                            value: String(option),
                                                            label: String(option),
                                                        }));

                                                        setAttributeOptionsMap((prev) => ({
                                                            ...prev,
                                                            [name]: attributeOptions,
                                                        }));

                                                        form.setFields([
                                                            {
                                                                name: ["filter", name, "options"],
                                                                value: undefined,
                                                            },
                                                        ]);
                                                    }}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name={[name, "operator"]}
                                                initialValue={"="}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Operator is required",
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    options={[
                                                        { label: "<>", value: "<>" },
                                                        { label: "=", value: "=" },
                                                        { label: "<", value: "<" },
                                                        { label: ">", value: ">" },
                                                    ]}
                                                    placeholder="Select Operator"
                                                />
                                            </Form.Item>
                                        </div>

                                        <Form.Item
                                            name={[name, "options"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "Options is required",
                                                },
                                            ]}
                                        >
                                            <Select
                                                mode="multiple"
                                                options={attributeOptionsMap[name] || []}
                                                placeholder="Select Options"
                                            />
                                        </Form.Item>
                                    </React.Fragment>
                                ))}
                            </div>
                            <Button
                                className="!font-bold w-full !mt-3"
                                type="link"
                                icon={<PlusCircleFilled />}
                                iconPosition="end"
                                onClick={() => add()}
                            >
                                ADD CONDITION
                            </Button>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};

export default MarkerFilter;
