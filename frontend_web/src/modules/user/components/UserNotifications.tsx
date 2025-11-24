/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { List, Avatar, Typography, Button, Pagination, Empty, Spin, Popconfirm } from "antd";
import { useNavigate } from "react-router-dom";
import { API } from "@/app/lib/axios-client";
import { NotificationItem } from "@/types/notification";
import { formatTimeAgo } from "@/utils/time-ago";
import { useUserNotificationStore } from "@/hooks/use-user-notification";

const { Title, Text } = Typography;

const PAGE_SIZE = 20;

export const UserNotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const {
        markRead,
        markAllRead,
        markReadLocal,
        markAllReadLocal,
        deleteOne,
        deleteAll,
    } = useUserNotificationStore();

    const fetchPage = async (pageNumber: number) => {
        setLoading(true);
        try {
            const res = await API.get("/notifications", {
                params: { page: pageNumber, limit: PAGE_SIZE },
            });

            const rawItems: any[] = res.data?.data?.items || [];
            const pagination = res.data?.data?.pagination || { total: 0 };

            const mapped: NotificationItem[] = rawItems.map((n) => ({
                id: n._id,
                title: n.title,
                message: n.message,
                thumbnailUrl: n.thumbnail_url,
                createdAt: n.createdAt,
                isRead: n.is_read,
                meta: n.meta
            }));

            setItems(mapped);
            setTotal(pagination.total || 0);
            setPage(pageNumber);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPage(1);
    }, []);

    const handleClickItem = async (item: NotificationItem) => {
        if (!item.isRead) {
            markReadLocal(item.id);
            await markRead(item.id);
            setItems((prev) =>
                prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x))
            );
        }

        if (item.meta?.order_id) {
            navigate(`/orders/${item.meta.order_id}/${item.meta?.order_number}`);
        } else {
            navigate("/orders");
        }
    };

    const handleMarkAllRead = async () => {
        markAllReadLocal();
        await markAllRead();
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    };

    const handleDeleteItem = async (item: NotificationItem) => {
        await deleteOne(item.id);
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        setTotal((prev) => Math.max(prev - 1, 0));
    };


    const handleDeleteAll = async () => {
        await deleteAll();
        setItems([]);
        setTotal(0);
        setPage(1);
    };
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Title level={4} className="!mb-1">
                        Thông báo của tôi
                    </Title>
                    <Text type="secondary">
                        Xem tất cả thông báo liên quan đến đơn hàng và tài khoản
                    </Text>
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
                    <>
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
                                                <div className="flex items-center gap-2">
                                                    {!item.isRead && (
                                                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                                                    )}
                                                    <span className="font-semibold text-sm line-clamp-1">
                                                        {item.title}
                                                    </span>
                                                </div>
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
                        <div className="mt-4 flex justify-center">
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={PAGE_SIZE}
                                onChange={(p) => fetchPage(p)}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
