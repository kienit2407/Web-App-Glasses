import { Outlet } from "react-router-dom";
import { Navbar } from "@/modules/user/components/Navbar";
import { Footer } from "@/modules/user/components/Footer";
import ScrollToTopButton from "@/modules/admin/components/ScrollToTopButton";
import { useShopSettingsStore } from "@/hooks/use-setting";
import { useEffect } from "react";
import { API } from "@/app/lib/axios-client";
import { PromotionHighlightEntry } from "@/modules/user/components/PromotionHighlightEntry";
import { SupportChatWidget } from "@/modules/user/components/SupportChatWidget";
import { useUserSocket } from "@/hooks/use-user-socket";
import { useAuth } from "@/hooks/use-auth";
import LiquidButton from "@/modules/user/components/LiquidButton";


export const UserLayout = () => {
    const { setSettings } = useShopSettingsStore();
    const { user } = useAuth()
    useUserSocket()
    useEffect(() => {
        const run = async () => {
            try {
                const res = await API.get("/shop-settings");
                setSettings(res.data?.data || null);
            } catch (err) {
                console.error("Load settings lỗi:", err);
            }
        };

        run();
    }, [setSettings]);
    return (
        <div className="min-h-screen flex flex-col bg-muted">
            <PromotionHighlightEntry />
            <Navbar />
            <main className="flex-1">
                <Outlet /> {/* render page con */}
            </main>
            <Footer />
            {user ? (<SupportChatWidget />) : null}
            <ScrollToTopButton showAfter={300} />
            

        </div>
    );
};