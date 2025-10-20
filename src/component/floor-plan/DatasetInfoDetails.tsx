import { Card, Empty, Form, Input, message } from "antd";
import { useContext, useEffect, useState } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";

const DatasetInfoDetails = () => {
    const [messageApi, contextHolderMessage] = message.useMessage();
    const { modal } = useContext(DrawerVisibilityContext);
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true; // To avoid error when adding a new floor while modal.selectedArea.value?.dataSetInfoId has a value
        const fetch = async () => {
            if (!(modal.dataSet.value?.dataSetId && modal.selectedArea.value?.dataSetInfoId)) {
                return;
            }

            try {
                setLoading(true);

                const dataSetInfo = await handleGetDatasetInfo({
                    getDatasetInfoId: modal.dataSet.value?.dataSetId,
                    args: {
                        andConditions: [
                            {
                                field: "id_primary",
                                values: modal.selectedArea.value?.dataSetInfoId,
                            },
                        ],
                    },
                });

                const info = dataSetInfo.data?.get_dataset_info.datasets?.[0];

                if (!info) {
                    if (!mounted) return;
                    messageApi.open({
                        type: "error",
                        content: "Dataset info does not exist!",
                    });
                    modal.form.dataSetInfo.resetFields();
                    modal.dataSetInfo.setValue(null);
                    return;
                }

                // Step 3: Save info and update form fields
                if (!mounted) return;
                modal.form.dataSetInfo.setFieldsValue(info);
                modal.dataSetInfo.setValue(info);
            } catch (err: any) {
                // Ignore AbortError which occurs when a previous request is cancelled by
                // the network layer (e.g. a subsequent query launched). This is not a
                // user-facing failure and pollutes logs/UI.
                const isAbort =
                    err && (err.name === "AbortError" || /aborted/i.test(err.message ?? ""));
                modal.form.dataSetInfo.resetFields();
                modal.dataSetInfo.setValue(null);
                if (!isAbort) {
                    messageApi.open({
                        type: "error",
                        content: "Failed to get dataset info!",
                    });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetch();

        return () => {
            // mark as unmounted for in-flight promises
            mounted = false;
        };
    }, [modal.dataSet.value?.dataSetId, modal.selectedArea.value?.dataSetInfoId]);

    return (
        <>
            {contextHolderMessage}
            <Card
                title="Dataset Information"
                loading={loading}
                styles={{
                    body: {
                        maxHeight: 700,
                        overflowY: "auto",
                        paddingRight: 8,
                    },
                }}
            >
                {modal.dataSetInfo.value ? (
                    <Form form={modal.form.dataSetInfo} layout="vertical" autoComplete="off">
                        {Object.entries(modal.dataSetInfo.value || {}).map(([key, value]) => (
                            <Form.Item key={key} label={key} name={key}>
                                <Input value={String(value)} readOnly />
                            </Form.Item>
                        ))}
                    </Form>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Card>
        </>
    );
};

export default DatasetInfoDetails;
