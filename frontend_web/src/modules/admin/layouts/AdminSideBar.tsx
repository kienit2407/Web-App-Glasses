import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    ShoppingCart,
    ListOrderedIcon,
    Tag,
    Star,
    LogOut,
    Bell,
    ChartSpline,
    SquareChartGantt,
    Store,
    MonitorCog,
    Headset,
    Ticket,
    Flame,
    Copyright,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { MenuProps, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { Menu } from "antd";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";
import { NotificationBell } from "@/modules/user/components/NotificationBell";

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Sản phẩm", icon: ShoppingBag, to: "/admin/products" },
    { label: "Đơn hàng", icon: ShoppingCart, to: "/admin/orders" },
    { label: "Người dùng", icon: Users, to: "/admin/users" },
    { label: "Danh mục", icon: ListOrderedIcon, to: "/admin/category" },
    { label: "Phiếu giảm giá", icon: Ticket, to: "/admin/coupon" },
    { label: "Nhãn hiệu", icon: Copyright, to: "/admin/brand" },
    { label: "Promotion", icon: Flame, to: "/admin/promotion" },
    { label: "Đánh giá", icon: SquareChartGantt, to: "/admin/reviews" },
    { label: "Thông báo", icon: Bell, to: "/admin/notifications" },
    { label: "Hỗ trợ khách hàng", icon: Headset, to: "/admin/conversations" },
    { label: "Cài đặt", icon: Settings, to: "/admin/settings" },
];

type MenuItem = Required<MenuProps>["items"][number];

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

const items: MenuItem[] = [
    { key: "1", icon: <LayoutDashboard />, label: "Dashboard" },
    {
        key: "sub1",
        label: "Quản lý cửa hàng",
        icon: <Store />,
        children: [
            {
                key: "users",
                icon: <Users />,
                label: <Link to="/admin/users">Người dùng</Link>,
            },
            {
                key: "orders",
                icon: <ShoppingCart />,
                label: <Link to="/admin/orders">Đơn hàng</Link>,
            },
            {
                key: "reviews",
                icon: <SquareChartGantt />,
                label: <Link to="/admin/reviews">Đánh giá</Link>,
            },
        ],
    },
    {
        key: "2",
        label: "Quản lý hệ thống",
        icon: <MonitorCog />,
        children: [
            {
                key: "products",
                icon: <ShoppingBag />,
                label: <Link to="/admin/products">Sản phẩm</Link>,
            },
            {
                key: "category",
                icon: <ListOrderedIcon />,
                label: <Link to="/admin/category">Danh mục</Link>,
            },
            {
                key: "coupon",
                icon: <Tag />,
                label: <Link to="/admin/coupon">Voucher</Link>,
            },
            {
                key: "promotion",
                icon: <ChartSpline />,
                label: <Link to="/admin/promotion">Promotion</Link>,
            },
            {
                key: "brand",
                icon: <Star />,
                label: <Link to="/admin/brand">Nhãn hiệu</Link>,
            },
            {
                key: "settings",
                icon: <Settings />,
                label: <Link to="/admin/settings">Cài đặt</Link>,
            },
        ],
    },
];

export const AdminSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const {
        items: notifItems,
        unreadCount: notifUnread,
        loading: notifLoading,
        fetchFirstPage,
        markRead,          // ✅ dùng bản có gọi API
        markAllRead,       // ✅
    } = useAdminNotificationStore();

    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    return (
        <aside
            className="
                hidden md:flex md:flex-col
                w-64 border-r bg-white
                h-full     
                justify-between
            "
        >
            {/* Header + Notification bell */}
            <div className="h-16 flex items-center justify-around px-4 border-b">
                <span className="font-bold text-xl text-primary">
                    VisionAdmin
                </span>

                <NotificationBell
                    items={notifItems}
                    unreadCount={notifUnread}
                    loading={notifLoading}
                    hasMore={false}
                    onLoadMore={undefined}
                    onItemClick={async (item) => {
                        // bấm vào 1 thông báo
                        if (!item.isRead) {
                            await markRead(item.id); // ✅ update local + gọi API
                        }

                        const orderId = item.meta?.order_id;
                        const orderNumber = item.meta?.order_number;

                        if (orderId) {
                            navigate(
                                orderNumber
                                    ? `/admin/orders/${orderId}/${orderNumber}`
                                    : `/admin/orders/${orderId}`
                            );
                        }
                    }}
                    onViewAll={() => {
                        navigate("/admin/notifications");
                    }}
                    onMarkAllRead={async () => {
                        await markAllRead(); // ✅ update local + gọi API
                    }}
                    onOpenChange={(open) => {
                        if (open) {
                            // mỗi lần mở dropdown thì sync lại với server
                            fetchFirstPage();
                        }
                    }}
                />
            </div>

            {/* Menu chính */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                [
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-slate-700 hover:bg-slate-100",
                                ].join(" ")
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* User info dưới cùng */}
            <div className="flex items-center space-x-3 px-3 py-4 border-t">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="max-w-[140px] truncate text-sm font-medium">
                        {user?.display_name}
                    </span>
                    <span className="max-w-[140px] truncate text-xs text-slate-500">
                        {user?.email}
                    </span>
                </div>
                <Popconfirm
                    trigger={"click"}
                    title={"Đăng xuất"}
                    description={"Bạn có muốn đăng xuất không"}
                    okText={"Tôi đồng ý"}
                    cancelText="Tôi không đồng ý"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => logout()}
                >
                    <button>
                        <LogOut className="text-red-500" />
                    </button>
                </Popconfirm>
            </div>
        </aside>
    );
};
