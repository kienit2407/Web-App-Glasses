import { Outlet } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSideBar";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { useEffect, useRef } from "react";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { SupportChatWidget } from "@/modules/user/components/SupportChatWidget";

export const AdminLayout = () => {
    useAdminSocket()
    return (
        <div className="h-screen flex overflow-hidden bg-slate-100">
            {/* Sidebar cố định bên trái */}
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </main>
                {/* Nút cuộn lên đầu trang */}
                <ScrollToTopButton showAfter={300} />
            </div>
        </div>
    );
};

export default AdminLayout