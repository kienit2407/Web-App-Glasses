import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    ShoppingCart,
    ListOrderedIcon,
    Bell,
    SquareChartGantt,
    Headset,
    Ticket,
    Flame,
    Copyright,
} from "lucide-react";

export type AdminNavKey =
    | "dashboard"
    | "products"
    | "orders"
    | "users"
    | "category"
    | "coupon"
    | "brand"
    | "promotion"
    | "reviews"
    | "notifications"
    | "conversations"
    | "settings";

export type AdminNavItem = {
    key: AdminNavKey;
    label: string;
    to: string;
    icon: LucideIcon;
    badge?: "notifications" | "support";
};

export const ADMIN_NAV: AdminNavItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { key: "products", label: "Sản phẩm", icon: ShoppingBag, to: "/admin/products" },
    { key: "orders", label: "Đơn hàng", icon: ShoppingCart, to: "/admin/orders" },
    { key: "users", label: "Người dùng", icon: Users, to: "/admin/users" },
    { key: "category", label: "Danh mục", icon: ListOrderedIcon, to: "/admin/category" },
    { key: "coupon", label: "Phiếu giảm giá", icon: Ticket, to: "/admin/coupon" },
    { key: "brand", label: "Nhãn hiệu", icon: Copyright, to: "/admin/brand" },
    { key: "promotion", label: "Promotion", icon: Flame, to: "/admin/promotion" },
    { key: "reviews", label: "Đánh giá", icon: SquareChartGantt, to: "/admin/reviews" },
    { key: "notifications", label: "Thông báo", icon: Bell, to: "/admin/notifications", badge: "notifications" },
    { key: "conversations", label: "Hỗ trợ khách hàng", icon: Headset, to: "/admin/conversations", badge: "support" },
    { key: "settings", label: "Cài đặt", icon: Settings, to: "/admin/settings" },
];

export const getTitleFromPath = (pathname: string) => {
    if (pathname.startsWith("/admin/products")) return "Quản lý sản phẩm";
    if (pathname.startsWith("/admin/orders")) return "Quản lý đơn hàng";
    if (pathname.startsWith("/admin/users")) return "Quản lý người dùng";
    if (pathname.startsWith("/admin/category")) return "Quản lý danh mục";
    if (pathname.startsWith("/admin/coupon")) return "Quản lý voucher";
    if (pathname.startsWith("/admin/brand")) return "Quản lý nhãn hiệu";
    if (pathname.startsWith("/admin/promotion")) return "Quản lý promotion";
    if (pathname.startsWith("/admin/reviews")) return "Quản lý đánh giá";
    if (pathname.startsWith("/admin/notifications")) return "Thông báo hệ thống";
    if (pathname.startsWith("/admin/conversations")) return "Hỗ trợ khách hàng";
    if (pathname.startsWith("/admin/settings")) return "Cài đặt hệ thống";
    return "Dashboard";
};
