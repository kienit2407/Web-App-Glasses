import { useLocation } from "react-router-dom";
import { Button } from "antd";
import { Menu as MenuIcon } from "lucide-react";
import { getTitleFromPath } from "../pages/admin/admin-nav";
import { NotificationBell } from "@/modules/user/components/NotificationBell";
import { useAdminNotificationStore } from "@/hooks/use-admin-notification";
import { useEffect } from "react";

type Props = {
    onOpenMenu?: () => void;
    isMobile?: boolean;
};

export const AdminHeader = ({ onOpenMenu, isMobile }: Props) => {
    const location = useLocation();
    const title = getTitleFromPath(location.pathname);

    const {
        items: notifItems,
        unreadCount: notifUnread,
        loading: notifLoading,
        fetchFirstPage,
        markRead,
        markAllRead,
    } = useAdminNotificationStore();

    useEffect(() => {
        // load nhẹ để badge kịp hiển thị
        fetchFirstPage();
    }, [fetchFirstPage]);

    return (
        <header className="sticky top-0 z-30 h-14 md:h-16 border-b bg-white flex items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-2 min-w-0">
                {isMobile && (
                    <Button
                        type="text"
                        onClick={onOpenMenu}
                        className="!px-2"
                        aria-label="Open menu"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </Button>
                )}
                <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell
                    items={notifItems}
                    unreadCount={notifUnread}
                    loading={notifLoading}
                    hasMore={false}
                    onLoadMore={undefined}
                    onItemClick={async (item) => {
                        if (!item.isRead) await markRead(item.id);
                    }}
                    onViewAll={() => { }}
                    onMarkAllRead={async () => {
                        await markAllRead();
                    }}
                    onOpenChange={(open) => {
                        if (open) fetchFirstPage();
                    }}
                />
            </div>
        </header>
    );
};
