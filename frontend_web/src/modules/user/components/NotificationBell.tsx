import React from "react";
import {
    Dropdown,
    Badge,
    List,
    Avatar,
    Typography,
    Button,
    Spin,
    Empty,
} from "antd";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/types/notification";
import { formatTimeAgo } from "@/utils/time-ago";

const { Text } = Typography;

interface NotificationBellProps {
    items: NotificationItem[];
    unreadCount: number;
    loading?: boolean;

    hasMore?: boolean;
    onLoadMore?: () => void;

    onItemClick: (item: NotificationItem) => void;
    onViewAll: () => void;
    onMarkAllRead: () => void;

    // 🔹 thêm: callback khi dropdown open/close
    onOpenChange?: (open: boolean) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    items,
    unreadCount,
    loading = false,
    hasMore = false,
    onLoadMore,
    onItemClick,
    onViewAll,
    onMarkAllRead,
    onOpenChange,
}) => {
    const hasItems = items && items.length > 0;

    const handleScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
        if (!hasMore || !onLoadMore || loading) return;

        const target = e.currentTarget;
        const threshold = 40;

        const distanceToBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight;

        if (distanceToBottom < threshold) {
            onLoadMore();
        }
    };

    const content = (
        <div className="w-[360px] bg-white rounded-lg shadow-lg border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Thông báo</span>
                {hasItems && unreadCount > 0 && (
                    <button
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAllRead();
                        }}
                    >
                        Đánh dấu đã đọc hết
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="max-h-[360px] overflow-y-auto" onScroll={handleScroll}>
                {loading && !hasItems ? (
                    <div className="flex items-center justify-center py-6">
                        <Spin />
                    </div>
                ) : !hasItems ? (
                    <div className="py-6 flex flex-col items-center justify-center">
                        <Empty description="Chưa có thông báo nào" />
                    </div>
                ) : (
                    <>
                        <List
                            itemLayout="horizontal"
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item
                                    className={`!px-4 py-3 cursor-pointer hover:bg-slate-100 ${!item.isRead ? "bg-slate-50/70" : ""
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onItemClick(item);
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                shape="square"
                                                size={40}
                                                src={item.thumbnailUrl || undefined}
                                                style={{ borderRadius: 8 }}
                                            >
                                                
                                            </Avatar>
                                        }
                                        title={
                                            <div className="flex items-center gap-2">
                                                <Text strong className="text-xs line-clamp-1">
                                                    {item.title}
                                                </Text>
                                                {!item.isRead && (
                                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                        }
                                        description={
                                            <div className="text-xs text-slate-500">
                                                <div className="line-clamp-2">{item.message}</div>
                                                <div className="mt-1 text-[11px] text-slate-400">
                                                    {formatTimeAgo(item.createdAt)}
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                        {hasMore && (
                            <div className="py-2 flex justify-center">
                                {loading && <Spin size="small" />}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            {hasItems && (
                <div className="px-4 py-2 border-t bg-slate-50 flex justify-center">
                    <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewAll();
                        }}
                    >
                        Xem tất cả thông báo
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            dropdownRender={() => content}
            onOpenChange={onOpenChange} 
        >
            <Badge count={unreadCount} size="default" overflowCount={99}>
                <button
                    type="button"
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition"
                >
                    <Bell className="h-[18px] w-[18px]" />
                </button>
            </Badge>
        </Dropdown>
    );
};
