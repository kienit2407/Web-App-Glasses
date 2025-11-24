// src/hooks/use-admin-notification.ts
import { create } from "zustand";
import { NotificationItem } from "@/types/notification";
import {
    fetchAdminNotifications,
    markAdminNotificationRead,
    markAdminNotificationsAllRead,
    deleteAdminNotification,
    deleteAllAdminNotifications,
} from "../utils/notification.api";

interface AdminNotificationState {
    items: NotificationItem[];
    unreadCount: number;
    loading: boolean;

    increase: (delta?: number) => void;
    reset: () => void;

    setList: (items: NotificationItem[], totalUnread: number) => void;
    prepend: (item: NotificationItem) => void;
    fetchFirstPage: () => Promise<void>;
    markReadLocal: (id: string) => void;
    markAllReadLocal: () => void;

    deleteOne: (id: string) => Promise<void>;
    deleteAll: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

export const useAdminNotificationStore = create<AdminNotificationState>(
    (set, get) => ({
        items: [],
        unreadCount: 0,
        loading: false,

        increase: (delta = 1) =>
            set((state) => ({ unreadCount: state.unreadCount + delta })),
        reset: () => set({ unreadCount: 0 }),

        setList: (items, totalUnread) =>
            set({
                items,
                unreadCount: totalUnread,
            }),

        prepend: (item) => {
            const current = get().items;
            set({
                items: [item, ...current],
                unreadCount: get().unreadCount + (item.isRead ? 0 : 1),
            });
        },

        fetchFirstPage: async () => {
            set({ loading: true });
            try {
                const { items, unreadCount } = await fetchAdminNotifications();
                set({ items, unreadCount, loading: false });
            } catch (err) {
                console.error("Failed to fetch admin notifications", err);
                set({ loading: false });
            }
        },

        markReadLocal: (id: string) => {
            const current = get().items;
            const newItems = current.map((it) =>
                it.id === id ? { ...it, isRead: true } : it
            );
            const wasUnread = current.find((it) => it.id === id && !it.isRead);
            set({
                items: newItems,
                unreadCount: wasUnread
                    ? Math.max(get().unreadCount - 1, 0)
                    : get().unreadCount,
            });
        },

        markAllReadLocal: () => {
            const current = get().items;
            const newItems = current.map((it) => ({ ...it, isRead: true }));
            set({ items: newItems, unreadCount: 0 });
        },

        // ====== kết hợp local + API ======
        markRead: async (id: string) => {
            get().markReadLocal(id);
            try {
                await markAdminNotificationRead(id);
            } catch (err) {
                console.error("Failed to mark admin notification read", err);
            }
        },

        markAllRead: async () => {
            get().markAllReadLocal();
            try {
                await markAdminNotificationsAllRead();
            } catch (err) {
                console.error("Failed to mark all admin notifications read", err);
            }
        },
        async deleteOne(id) {
            const prevItems = get().items;
            const nextItems = prevItems.filter((i) => i.id !== id);
            const nextUnread = nextItems.filter((i) => !i.isRead).length;
            set({ items: nextItems, unreadCount: nextUnread });

            try {
                await deleteAdminNotification(id);
            } catch (err) {
                console.error("Failed to delete admin notification", err);
                
            }
        },

        async deleteAll() {
            const prevItems = get().items;
            set({ items: [], unreadCount: 0 });
            try {
                await deleteAllAdminNotifications();
            } catch (err) {
                console.error("Failed to delete all admin notifications", err);
                // nếu cần rollback:
                // const unread = prevItems.filter(i => !i.isRead).length;
                // set({ items: prevItems, unreadCount: unread });
            }
        },
    })
);
