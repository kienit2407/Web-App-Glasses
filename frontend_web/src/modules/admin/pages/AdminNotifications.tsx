/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { List, Avatar, Typography, Button, Empty, Spin, Popconfirm } from "antd";
import { useNavigate } from "react-router-dom";
import { NotificationItem } from "@/types/notification";
import { formatTimeAgo } from "@/utils/time-ago";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";

const { Title, Text } = Typography;

export const AdminNotificationsPage = () => {
    const navigate = useNavigate();

    const {
        items,
        unreadCount,
        loading,
        fetchFirstPage,
        markRead,
        markAllRead,
        deleteOne,
        deleteAll,
    } = useAdminNotificationStore();

    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    const handleClickItem = async (item: NotificationItem) => {
        if (!item.isRead) {
            await markRead(item.id);
        }

        const orderId = item.meta?.order_id;
        const orderNumber = item.meta?.order_number;

        if (orderId) {
            if (orderNumber) {
                navigate(`/admin/orders/${orderId}/${orderNumber}`);
            } else {
                navigate(`/admin/orders/${orderId}`);
            }
        }
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
    };

    const handleDeleteItem = async (item: NotificationItem) => {
        await deleteOne(item.id);
    };


    const handleDeleteAll = async () => {
        await deleteAll();
    };

    return (
        <div className="p-4">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Title level={4} className="!mb-1">
                        Thông báo hệ thống
                    </Title>
                    <Text type="secondary">
                        Đơn hàng mới, yêu cầu huỷ / trả hàng, và các cập nhật quan trọng
                    </Text>
                    {unreadCount > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                            Bạn có {unreadCount} thông báo chưa đọc
                        </div>
                    )}
                </div>
                {items.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button size="small" onClick={handleMarkAllRead}>
                            Đánh dấu tất cả là đã đọc
                        </Button>
                        <Popconfirm
                            title="Bạn chắc chắn muốn xoá tất cả thông báo?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={handleDeleteAll}
                        >
                            <Button size="small" danger>
                                Xoá tất cả
                            </Button>
                        </Popconfirm>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border px-4 py-3">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Spin />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center">
                        <Empty description="Chưa có thông báo nào" />
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={items}
                        renderItem={(item) => (
                            <List.Item
                                className={`cursor-pointer px-2 py-3 hover:bg-slate-50 ${!item.isRead ? "bg-slate-50/80" : ""
                                    }`}
                                onClick={() => handleClickItem(item)}
                                actions={[
                                    <Popconfirm
                                        key="delete"
                                        title="Xoá thông báo này?"
                                        okText="Xoá"
                                        cancelText="Huỷ"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={(e) => {
                                            e?.stopPropagation?.();
                                            handleDeleteItem(item);
                                        }}
                                    >
                                        <Button
                                            size="small"
                                            danger
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Xoá
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            shape="square"
                                            size={48}
                                            src={item.thumbnailUrl || undefined}
                                            style={{ borderRadius: 8 }}
                                        >
                                            {!item.thumbnailUrl && "SP"}
                                        </Avatar>
                                    }
                                    title={
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-sm line-clamp-1">
                                                {item.title}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {formatTimeAgo(item.createdAt)}
                                            </span>
                                        </div>
                                    }
                                    description={
                                        <div className="text-xs text-slate-600 line-clamp-2">
                                            {item.message}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );
};
