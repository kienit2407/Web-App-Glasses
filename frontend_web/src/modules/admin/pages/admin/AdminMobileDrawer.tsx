import { Drawer, Popconfirm, Badge } from "antd";
import { NavLink, useNavigate } from "react-router-dom";
import { ADMIN_NAV } from "./admin-nav";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAdminSupportBadgeStore } from "@/hooks/use-admin-support-badge";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";

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

type Props = {
    open: boolean;
    onClose: () => void;
};

export const AdminMobileDrawer = ({ open, onClose }: Props) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const supportUnread = useAdminSupportBadgeStore((s) => s.unreadChatCount);
    const notifUnread = useAdminNotificationStore((s) => s.unreadCount);

    return (
        <Drawer
            title={<span className="font-bold">VisionAdmin</span>}
            placement="left"
            open={open}
            onClose={onClose}
            width={320}
            bodyStyle={{ padding: 12 }}
        >
            <nav className="space-y-1">
                {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const badgeCount =
                        item.badge === "support" ? supportUnread : item.badge === "notifications" ? notifUnread : 0;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => onClose()}
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
                                    <Badge count={badgeCount} size="small" overflowCount={99} />
                                )}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="mt-4 border-t pt-4 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{user?.display_name}</div>
                    <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>

                <Popconfirm
                    trigger="click"
                    title="Đăng xuất"
                    description="Bạn có muốn đăng xuất không?"
                    okText="Đồng ý"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => {
                        logout();
                        onClose();
                        navigate("/"); // tuỳ bạn
                    }}
                >
                    <button aria-label="Logout">
                        <LogOut className="text-red-500" />
                    </button>
                </Popconfirm>
            </div>
        </Drawer>
    );
};
