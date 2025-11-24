import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const getTitleFromPath = (pathname: string) => {
    if (pathname.startsWith("/admin/products")) return "Quản lý sản phẩm";
    if (pathname.startsWith("/admin/orders")) return "Quản lý đơn hàng";
    if (pathname.startsWith("/admin/users")) return "Quản lý người dùng";
    if (pathname.startsWith("/admin/settings")) return "Cài đặt hệ thống";
    return "Dashboard";
};

export const AdminHeader = () => {
    const location = useLocation();
    const title = getTitleFromPath(location.pathname);

    return (
        <header className="sticky h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6">
            <h1 className="text-lg font-semibold">{title}</h1>
        </header>
    );
};
