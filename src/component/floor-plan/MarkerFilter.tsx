import { DeleteOutlined, PlusCircleFilled } from "@ant-design/icons";
import { Button, Divider, Form, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useGetDatasetAttributeOptions } from "../../api/hooks/useGetDatasetAttributeOptions";
import { useGetDatasetHeaders } from "../../api/hooks/useGetDatasetHeaders";

const MarkerFilter = () => {
    const [form] = Form.useForm();
    const { handleGetDatasetHeaders } = useGetDatasetHeaders();
    const { handleGetAttributeOptions } = useGetDatasetAttributeOptions();

    const [headerOptions, setHeaderOptions] = useState<{ value: string; label: string }[]>([]);
    const [attributeOptionsMap, setAttributeOptionsMap] = useState<
        Record<number, { value: string; label: string }[]>
    >({});

    useEffect(() => {
        const fetch = async () => {
            const respHeaders = await handleGetDatasetHeaders({
                getDatasetInfoHeadersId: "1",
            });

            const options =
                respHeaders.data?.get_dataset_info_headers.headers?.map((header) => ({
                    value: header.name,
                    label: header.name,
                })) || [];

            setHeaderOptions(options);
        };

        fetch();
    }, []);

    const onFinish = (values: any) => {
        console.log("Form Values:", values);
    };

    return (
        <Modal open={false} title="Filter" onOk={() => form.submit()}>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ filter: [{}] }}
            >
                <Form.List name="filter">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name }) => (
                                <React.Fragment key={key}>
                                    {fields.length > 1 && (
                                        <Divider orientation="right">
                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined style={{ color: "red" }} />}
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
                            <Button
                                className="!font-bold w-full"
                                type="link"
                                icon={<PlusCircleFilled />}
                                iconPosition="end"
                                onClick={() => add()}
                            >
                                Add Condition
                            </Button>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};

export default MarkerFilter;
