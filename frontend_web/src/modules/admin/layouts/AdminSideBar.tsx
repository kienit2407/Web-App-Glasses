import { NavLink, useNavigate } from "react-router-dom";
import { Badge, Popconfirm } from "antd";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/modules/user/components/NotificationBell";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";
import { useEffect } from "react";
import { useAdminSupportBadgeStore } from "@/hooks/use-admin-support-badge";
import { ADMIN_NAV } from "../pages/admin/admin-nav";

const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export const AdminSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const supportUnread = useAdminSupportBadgeStore((s) => s.unreadChatCount);

    const {
        items: notifItems,
        unreadCount: notifUnread,
        loading: notifLoading,
        fetchFirstPage,
        markRead,
        markAllRead,
    } = useAdminNotificationStore();

    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    return (
        <aside className="hidden md:flex md:flex-col w-64 border-r bg-white h-full justify-between">
            <div>
                <div className="h-16 flex items-center justify-between px-4 border-b">
                    <span className="font-bold text-xl text-primary">VisionAdmin</span>

                    <NotificationBell
                        items={notifItems}
                        unreadCount={notifUnread}
                        loading={notifLoading}
                        hasMore={false}
                        onLoadMore={undefined}
                        onItemClick={async (item) => {
                            if (!item.isRead) await markRead(item.id);

                            const orderId = item.meta?.order_id;
                            const orderNumber = item.meta?.order_number;
                            if (orderId) {
                                navigate(orderNumber ? `/admin/orders/${orderId}/${orderNumber}` : `/admin/orders/${orderId}`);
                            }
                        }}
                        onViewAll={() => navigate("/admin/notifications")}
                        onMarkAllRead={async () => {
                            await markAllRead();
                        }}
                        onOpenChange={(open) => {
                            if (open) fetchFirstPage();
                        }}
                    />
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                    {ADMIN_NAV.map((item) => {
                        const Icon = item.icon;
                        const isSupport = item.badge === "support";
                        const isNotif = item.badge === "notifications";
                        const badgeCount = isSupport ? supportUnread : isNotif ? notifUnread : 0;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-100",
                                    ].join(" ")
                                }
                            >
                                <Icon className="w-4 h-4" />
                                <span className="flex-1 flex items-center justify-between">
                                    <span>{item.label}</span>
                                    {badgeCount > 0 && (
                                        <Badge count={badgeCount} size="small" overflowCount={99} className="ml-2" />
                                    )}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center space-x-3 px-3 py-4 border-t">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium">{user?.display_name}</span>
                    <span className="block truncate text-xs text-slate-500">{user?.email}</span>
                </div>

                <Popconfirm
                    trigger="click"
                    title="Đăng xuất"
                    description="Bạn có muốn đăng xuất không?"
                    okText="Đồng ý"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => logout()}
                >
                    <button aria-label="Logout">
                        <LogOut className="text-red-500" />
                    </button>
                </Popconfirm>
            </div>
        </aside>
    );
};
