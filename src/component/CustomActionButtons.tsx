import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Divider, Space, Tooltip } from "antd";

const CustomActionButtons = ({
    actions,
    disabledActions = [],
    handleView,
    handleEdit,
    handleDelete,
}: {
    actions?: Array<"view" | "edit" | "delete">;
    disabledActions?: Array<"view" | "edit" | "delete">;
    handleView?: () => void;
    handleEdit?: () => void;
    handleDelete?: () => void;
}) => {
    const actionConfig = [
        {
            key: "view",
            title: "View",
            icon: (disabled: boolean) => (
                <EyeOutlined className={disabled ? "!text-gray-400" : "!text-blue-500"} />
            ),
            onClick: handleView,
        },
        {
            key: "edit",
            title: "Edit",
            icon: (disabled: boolean) => (
                <EditOutlined className={disabled ? "!text-gray-400" : "!text-blue-500"} />
            ),
            onClick: handleEdit,
        },
        {
            key: "delete",
            title: "Delete",
            icon: (disabled: boolean) => (
                <DeleteOutlined className={disabled ? "!text-gray-400" : "!text-red-500"} />
            ),
            onClick: handleDelete,
        },
    ];

    const visibleActions = actionConfig.filter(
        (action) => !actions || actions.includes(action.key as any)
    );

    return (
        <Space size="small">
            {visibleActions.map((action, index) => {
                const isDisabled = disabledActions.includes(action.key as any);
                return (
                    <span key={action.key}>
                        {index > 0 && <Divider type="vertical" />}
                        <Tooltip placement="top" title={action.title}>
                            <Button
                                type="text"
                                icon={action.icon(isDisabled)} // ✅ pass disabled state to icon
                                onClick={action.onClick}
                                disabled={isDisabled}
                            />
                        </Tooltip>
                    </span>
                );
            })}
        </Space>
    );
};

export default CustomActionButtons;
