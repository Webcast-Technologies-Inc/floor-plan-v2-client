import { Card, Empty, Form, Input } from "antd";
import { useContext, useEffect, useState } from "react";
import { useGetDatasetInfo } from "../../api/hooks/useGetDatasetInfo";
import { useGetDatasets } from "../../api/hooks/useGetDatasets";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";

const DatasetInfoDetails = () => {
    const { modal } = useContext(DrawerVisibilityContext);
    const { handleGetDatasets } = useGetDatasets();
    const { handleGetDatasetInfo } = useGetDatasetInfo();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [datasetInfo, setDatasetInfo] = useState<any>();

    useEffect(() => {
        const fetch = async () => {
            if (!(modal.selectedArea.value?.id_primary || modal.selectedArea.value?.alias)) {
                form.resetFields();
                setDatasetInfo(null);
                return;
            }
            setLoading(true);

            const datasets = await handleGetDatasets({
                args: {
                    andConditions: [
                        {
                            field: "alias",
                            values: modal.selectedArea.value?.alias,
                        },
                    ],
                },
            });

            console.log("datasets >> ", datasets);

            console.log(
                "Datasets: ",
                datasets.data?.get_datasets.datasets[0]?.id,
                " ",
                modal.selectedArea.value?.id_primary
            );

            if (!datasets.data?.get_datasets.datasets[0]?.id) {
                console.log("dataset does not exist");
                form.resetFields();
                setDatasetInfo(null);
                setLoading(false);
                return;
            }

            const dataSetInfo = await handleGetDatasetInfo({
                getDatasetInfoId: datasets.data?.get_datasets.datasets[0]?.id,
                args: {
                    andConditions: [
                        {
                            field: "id_primary",
                            values: modal.selectedArea.value?.id_primary,
                        },
                    ],
                },
            });

            const info = dataSetInfo.data?.get_dataset_info.datasets?.[0];

            if (!info) {
                console.log("dataset info does not exist");
                form.resetFields();
                setDatasetInfo(null);
                setLoading(false);
                return;
            }

            // Step 3: Save info and update form fields
            setDatasetInfo(info);
            form.setFieldsValue(info);
            setLoading(false);
        };

        fetch();
    }, [modal.selectedArea.value?.id_primary, modal.selectedArea.value?.alias]);

    return (
        <Card
            title="Dataset Info Details"
            loading={loading}
            styles={{
                body: {
                    maxHeight: 700,
                    overflowY: "auto",
                    paddingRight: 8,
                },
            }}
        >
            {datasetInfo ? (
                <Form form={form} layout="vertical" autoComplete="off">
                    {Object.entries(datasetInfo || {}).map(([key, value]) => (
                        <Form.Item key={key} label={key} name={key}>
                            <Input value={String(value)} readOnly />
                        </Form.Item>
                    ))}
                </Form>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>
    );
};

export default DatasetInfoDetails;
