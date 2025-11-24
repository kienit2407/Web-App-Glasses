// src/hooks/use-user-notification.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { NotificationItem } from "@/types/notification";
import {
    fetchUserNotifications,
    markUserNotificationRead,
    markUserNotificationsAllRead,
    deleteUserNotification,
    deleteAllUserNotifications,
} from "../utils/notification.api";

interface UserNotificationState {
    items: NotificationItem[];
    unreadCount: number;
    loading: boolean;

    // load lần đầu (navbar bell)
    fetchFirstPage: () => Promise<void>;

    // dùng cho socket: push noti mới vào đầu
    prepend: (item: NotificationItem) => void;

    // update local state (không call API) – để UI phản hồi nhanh
    markReadLocal: (id: string) => void;
    markAllReadLocal: () => void;

    // call API + đồng bộ store
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;

    deleteOne: (id: string) => Promise<void>;
    deleteAll: () => Promise<void>;
    reset: () => void;
}

export const useUserNotificationStore = create<UserNotificationState>(
    (set, get) => ({
        items: [],
        unreadCount: 0,
        loading: false,

        async fetchFirstPage() {
            set({ loading: true });
            try {
                const { items, unreadCount } = await fetchUserNotifications();
                set({ items, unreadCount, loading: false });
            } catch (err) {
                console.error("fetch user notifications error", err);
                set({ loading: false });
            }
        },

        prepend(item) {
            const items = [item, ...get().items];
            const unreadCount = items.filter((i) => !i.isRead).length;
            set({ items, unreadCount });
        },

        markReadLocal(id) {
            const items = get().items.map((i) =>
                i.id === id ? { ...i, isRead: true } : i
            );
            const unreadCount = items.filter((i) => !i.isRead).length;
            set({ items, unreadCount });
        },

        markAllReadLocal() {
            const items = get().items.map((i) => ({ ...i, isRead: true }));
            set({ items, unreadCount: 0 });
        },

        async markRead(id) {
            await markUserNotificationRead(id);
            const items = get().items.map((i) =>
                i.id === id ? { ...i, isRead: true } : i
            );
            const unreadCount = items.filter((i) => !i.isRead).length;
            set({ items, unreadCount });
        },

        async markAllRead() {
            await markUserNotificationsAllRead();
            const items = get().items.map((i) => ({ ...i, isRead: true }));
            set({ items, unreadCount: 0 });
        },
        async deleteOne(id) {
            // có thể optimistic update:
            const prevItems = get().items;
            const nextItems = prevItems.filter((i) => i.id !== id);
            const nextUnread = nextItems.filter((i) => !i.isRead).length;
            set({ items: nextItems, unreadCount: nextUnread });

            try {
                await deleteUserNotification(id);
            } catch (err) {
                console.error("delete user notification error", err);
                // nếu muốn cẩn thận, rollback:
                // set({ items: prevItems, unreadCount: prevItems.filter(i => !i.isRead).length });
            }
        },

      
        async deleteAll() {
            // optimistic
            set({ items: [], unreadCount: 0 });
            try {
                await deleteAllUserNotifications();
            } catch (err) {
                console.error("delete all user notifications error", err);
                // tuỳ bạn có cần rollback hay không
            }
        },

        reset() {
            set({ items: [], unreadCount: 0 });
        },
    })
);
