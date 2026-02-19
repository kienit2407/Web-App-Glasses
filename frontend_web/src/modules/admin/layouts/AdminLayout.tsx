import { Outlet } from "react-router-dom";
import { useState } from "react";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { AdminHeader } from "./AdminHeader";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { AdminSidebar } from "./AdminSideBar";
import { AdminMobileDrawer } from "../pages/admin/AdminMobileDrawer";
import { AdminBottomNav } from "../pages/admin/AdminBottomNav";

export const AdminLayout = () => {
    useAdminSocket();

    const isMobile = useIsMobile();
    const [openMenu, setOpenMenu] = useState(false);

    return (
        <div className="h-dvh flex overflow-hidden bg-slate-100">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader isMobile={isMobile} onOpenMenu={() => setOpenMenu(true)} />
                <AdminMobileDrawer open={openMenu} onClose={() => setOpenMenu(false)} />

                <main className={`flex-1 overflow-y-auto p-3 md:p-4 ${isMobile ? "pb-20" : ""}`}>
                    <Outlet />
                </main>

                {isMobile && <AdminBottomNav />}
                <ScrollToTopButton showAfter={300} />
            </div>
        </div>
    );
};

export default AdminLayout;
