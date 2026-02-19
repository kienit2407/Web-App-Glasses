/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { List, Avatar, Typography, Button, Empty, Spin, Popconfirm, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { NotificationItem } from "@/types/notification";
import { formatTimeAgo } from "@/utils/time-ago";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";
import { MoreHorizontal } from "lucide-react";

const { Title, Text } = Typography;

export const AdminNotificationsPage = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

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

    // action sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<NotificationItem | null>(null);

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
            if (orderNumber) navigate(`/admin/orders/${orderId}/${orderNumber}`);
            else navigate(`/admin/orders/${orderId}`);
        }
    };

    const handleDeleteItem = async (item: NotificationItem) => {
        await deleteOne(item.id);
        setSheetOpen(false);
    };

    const handleDeleteAll = async () => {
        await deleteAll();
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
    };

    return (
        <div className="p-4">
            <div className={`mb-6 flex ${isMobile ? "flex-col items-stretch" : "items-center justify-between"} gap-3`}>
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
                    <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-2`}>
                        <Button size="small" className={isMobile ? "w-full" : ""} onClick={handleMarkAllRead}>
                            Đánh dấu tất cả là đã đọc
                        </Button>

                        <Popconfirm
                            title="Bạn chắc chắn muốn xoá tất cả thông báo?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={handleDeleteAll}
                        >
                            <Button size="small" danger className={isMobile ? "w-full" : ""}>
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
                    <>
                        <List
                            itemLayout="horizontal"
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <div
                                        className={`w-full rounded-lg border p-3 cursor-pointer hover:bg-slate-50 ${!item.isRead ? "bg-slate-50/80" : "bg-white"
                                            }`}
                                        onClick={() => handleClickItem(item)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                shape="square"
                                                size={isMobile ? 44 : 48}
                                                src={item.thumbnailUrl || undefined}
                                                style={{ borderRadius: 8 }}
                                            >
                                                {!item.thumbnailUrl && "SP"}
                                            </Avatar>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {!item.isRead ? <Tag color="red">Chưa đọc</Tag> : <Tag>Đã đọc</Tag>}
                                                    <span className="text-[11px] text-slate-400">
                                                        {formatTimeAgo(item.createdAt)}
                                                    </span>
                                                </div>

                                                <div className="mt-1 font-semibold text-sm line-clamp-1">
                                                    {item.title}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-600 line-clamp-2">
                                                    {item.message}
                                                </div>
                                            </div>

                                            <Button
                                                type="text"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetItem(item);
                                                    setSheetOpen(true);
                                                }}
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />

                        <MobileActionSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            title={<span className="font-semibold">{sheetItem?.title}</span>}
                        >
                            <div className="space-y-2">
                                <Button
                                    block
                                    onClick={() => {
                                        if (!sheetItem) return;
                                        handleClickItem(sheetItem);
                                        setSheetOpen(false);
                                    }}
                                >
                                    Xem chi tiết
                                </Button>

                                {!sheetItem?.isRead && (
                                    <Button
                                        block
                                        onClick={async () => {
                                            if (!sheetItem) return;
                                            await markRead(sheetItem.id);
                                            setSheetOpen(false);
                                        }}
                                    >
                                        Đánh dấu đã đọc
                                    </Button>
                                )}

                                <Popconfirm
                                    title="Xoá thông báo này?"
                                    okText="Xoá"
                                    cancelText="Huỷ"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => sheetItem && handleDeleteItem(sheetItem)}
                                >
                                    <Button block danger>
                                        Xoá
                                    </Button>
                                </Popconfirm>
                            </div>
                        </MobileActionSheet>
                    </>
                )}
            </div>
        </div>
    );
};
