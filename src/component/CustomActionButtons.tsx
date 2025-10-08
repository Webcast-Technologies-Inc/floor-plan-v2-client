import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Divider, Space, Tooltip } from "antd";

const CustomActionButtons = ({
    actions,
    handleView,
    handleEdit,
    handleDelete,
}: {
    actions?: Array<"view" | "edit" | "delete">;
    handleView?: () => void;
    handleEdit?: () => void;
    handleDelete?: () => void;
}) => {
    const actionConfig = [
        {
            key: "view",
            title: "View",
            icon: <EyeOutlined className="!text-blue-500" />,
            onClick: handleView,
        },
        {
            key: "edit",
            title: "Edit",
            icon: <EditOutlined className="!text-blue-500" />,
            onClick: handleEdit,
        },
        {
            key: "delete",
            title: "Delete",
            icon: <DeleteOutlined className="!text-red-500" />,
            onClick: handleDelete,
        },
    ];

    const visibleActions = actionConfig.filter(
        (action) => !actions || actions.includes(action.key as any)
    );

    return (
        <Space size="small">
            {visibleActions.map((action, index) => (
                <span key={action.key}>
                    {index > 0 && <Divider type="vertical" />}
                    <Tooltip placement="top" title={action.title}>
                        <Button type="text" icon={action.icon} onClick={action.onClick} />
                    </Tooltip>
                </span>
            ))}
        </Space>
    );
};

export default CustomActionButtons;
