import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Select } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useGetDatasetAttributeOptions } from "../../api/hooks/useGetDatasetAttributeOptions";
import { useGetDatasetHeaders } from "../../api/hooks/useGetDatasetHeaders";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea, IMarkerFilter } from "../../types/floorPlan";

const MarkerFilter = () => {
    const { filterModal, floorPlanPage } = useContext(DrawerVisibilityContext);
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const { handleGetDatasetHeaders, loading: loadingGetDatasetHeaders } = useGetDatasetHeaders();
    const { handleGetAttributeOptions, loading: loadingGetAttributeOptions } =
        useGetDatasetAttributeOptions();
    const [headerOptions, setHeaderOptions] = useState<{ value: string; label: string }[]>([]);
    const [attributeOptionsMap, setAttributeOptionsMap] = useState<
        Record<number, { value: string; label: string }[]>
    >({});
    const [savedFormValues, setSavedFormValues] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            if (!(floorPlanPage.dataset.value?.dataSetId && filterModal.view.visible)) {
                return;
            }

            // Save current form values when modal opens
            setSavedFormValues(filterModal.form.getFieldsValue());

            const respHeaders = await handleGetDatasetHeaders({
                getDatasetInfoHeadersId: floorPlanPage.dataset.value?.dataSetId,
            });

            const options =
                respHeaders.data?.get_dataset_info_headers.headers?.map((header) => ({
                    value: header.name,
                    label: header.name,
                })) || [];

            setHeaderOptions(options);
        };

        fetch();
    }, [filterModal.view.visible, floorPlanPage.dataset.value?.dataSetId]);

    useEffect(() => {
        /* Preloads attribute options for already-selected filters (e.g. restoring state) */
        const fetchAttributeOptions = async () => {
            if (!filterModal.view.visible) {
                return;
            }

            const filters = filterModal.form.getFieldValue("filter") || [];
            const updatedMap: Record<number, { value: string; label: string }[]> = {};

            for (const [index, filter] of filters.entries()) {
                if (!(filter?.attribute && floorPlanPage.dataset.value?.dataSetId)) continue;

                try {
                    const respAttribute = await handleGetAttributeOptions({
                        attributeName: filter.attribute,
                        getDatasetAttributeOptionsId: floorPlanPage.dataset.value?.dataSetId,
                    });

                    const attributeOptions = (
                        respAttribute.data?.get_dataset_attribute_options.options || []
                    ).map((option) => ({
                        value: String(option),
                        label: String(option),
                    }));

                    updatedMap[index] = attributeOptions;
                } catch (err: any) {
                    // Safely ignore abort/cancel errors
                    if (err.name !== "AbortError" && err.code !== "ERR_CANCELED") {
                        console.error("Failed to fetch attribute options:", err);
                    }
                }
            }

            setAttributeOptionsMap(updatedMap);
        };

        fetchAttributeOptions();
    }, [filterModal.view.visible, floorPlanPage.dataset.value?.dataSetId]);

    const onClose = () => {
        // Restore saved form values when closing without applying
        if (savedFormValues) {
            filterModal.form.setFieldsValue(savedFormValues);
        }
        filterModal.view.setVisible(false);
    };

    const onAfterClose = () => {
        setHeaderOptions([]);
        setAttributeOptionsMap({});
    };

    const onFinish = async (values: { filter: IMarkerFilter[] }) => {
        if (!(floorPlanPage.dataset.value?.dataSetId && floorPlanPage.dataset.value?.areas)) {
            return;
        }

        const filter = values.filter
            .map(({ operator, options, attribute }) => {
                if (operator === "=") {
                    return {
                        equal: options,
                        field: attribute,
                    };
                }

                if (operator === "<>") {
                    return {
                        not: options,
                        field: attribute,
                    };
                }

                if (operator === "<" || operator === ">") {
                    return {
                        range: options.map((value) => ({
                            comparator: operator,
                            value,
                        })),
                        field: attribute,
                    };
                }

                return undefined;
            })
            .filter(Boolean);

        const dataSetInfo = await handleGetDatasetInfo({
            getDatasetInfoId: floorPlanPage.dataset.value?.dataSetId,
            args: {
                advanced: filter,
                andConditions: [
                    {
                        field: "id_primary",
                        values: floorPlanPage.dataset.value?.areas.map(
                            (area: IFloorPlanArea) => area.dataSetInfoId
                        ),
                    },
                ],
            },
        });

        const filteredDataSet = dataSetInfo.data?.get_dataset_info.datasets;
        filterModal.dataSet.setValue(filteredDataSet);
        if (
            !filteredDataSet?.some(
                (data) => data.id_primary == floorPlanPage.selectedArea.value?.dataSetInfoId
            )
        ) {
            floorPlanPage.form.dataSetInfo.resetFields();
            floorPlanPage.stallInfoDataset.setValue(null);
            floorPlanPage.selectedArea.setValue(null);
        }

        // Update saved values after successful apply
        setSavedFormValues(filterModal.form.getFieldsValue());
        filterModal.view.setVisible(false);
    };

    return (
        <Modal
            open={filterModal.view.visible}
            title="Filter"
            onCancel={onClose}
            footer={[
                <div className="flex flex-col gap-y-2">
                    <Button key="apply" type="primary" onClick={() => filterModal.form.submit()}>
                        Apply Filters
                    </Button>
                    <Button
                        key="clear"
                        onClick={() => {
                            filterModal.dataSet.setValue(null);
                            filterModal.form.resetFields();
                            setSavedFormValues(filterModal.form.getFieldsValue());
                            filterModal.view.setVisible(false);
                        }}
                    >
                        Clear Fields
                    </Button>
                </div>,
            ]}
            afterClose={onAfterClose}
            loading={loadingGetDatasetHeaders}
        >
            <Form
                form={filterModal.form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ filter: [{}] }}
            >
                <Form.List name="filter">
                    {(fields, { add, remove }) => (
                        <>
                            <div className="max-h-[50vh] overflow-y-auto !pr-2">
                                {fields.map(({ key, name }, index) => (
                                    <React.Fragment key={key}>
                                        {fields.length > 1 && (
                                            <div className="flex justify-between items-center !mb-2">
                                                <p>Condition {index + 1}</p>
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <DeleteOutlined style={{ color: "red" }} />
                                                    }
                                                    onClick={() => remove(name)}
                                                />
                                            </div>
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
                                                        /* Fetches attribute options when user selects a new attribute */
                                                        if (
                                                            !floorPlanPage.dataset.value?.dataSetId
                                                        ) {
                                                            return;
                                                        }

                                                        const respAttribute =
                                                            await handleGetAttributeOptions({
                                                                attributeName: value,
                                                                getDatasetAttributeOptionsId:
                                                                    floorPlanPage.dataset.value
                                                                        ?.dataSetId,
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

                                                        filterModal.form.setFields([
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
                                                disabled={
                                                    !attributeOptionsMap[name] ||
                                                    loadingGetAttributeOptions
                                                }
                                            />
                                        </Form.Item>
                                    </React.Fragment>
                                ))}
                            </div>
                            <Button type="link" onClick={() => add()}>
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
