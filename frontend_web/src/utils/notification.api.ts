/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/notification.api.ts
import { API } from "@/app/lib/axios-client";
import type { NotificationItem } from "@/types/notification";

interface RawNotification {
    _id: string;
    title: string;
    message: string;
    thumbnail_url: string | null;
    is_read: boolean;
    createdAt: string;
    meta?: any;
}


interface ListResponse {
    data: {
        items: RawNotification[];
        pagination: { page: number; limit: number; total: number };
    };
}

// ===== USER =====
export const fetchUserNotifications = async (): Promise<{
    items: NotificationItem[];
    unreadCount: number;
}> => {
    const res = await API.get<ListResponse>("/notifications", {
        params: { page: 1, limit: 20 },
    });

    const rawItems = res.data.data.items;

    const items: NotificationItem[] = rawItems.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        thumbnailUrl: n.thumbnail_url,
        createdAt: n.createdAt,
        isRead: n.is_read,
        meta: n.meta ?? undefined,
    }));

    const unreadCount = items.filter((i) => !i.isRead).length;

    return { items, unreadCount };
};

export const deleteUserNotification = (id: string) =>
    API.delete(`/notifications/${id}`);

export const deleteAllUserNotifications = () =>
    API.delete("/notifications");
export const markUserNotificationRead = (id: string) =>
    API.patch(`/notifications/${id}/read`);

export const markUserNotificationsAllRead = () =>
    API.patch("/notifications/read-all");

// ===== ADMIN =====
export const fetchAdminNotifications = async (): Promise<{
    items: NotificationItem[];
    unreadCount: number;
}> => {
    const res = await API.get<ListResponse>("/admin/notifications", {
        params: { page: 1, limit: 20 },
    });

    const rawItems = res.data.data.items;

    const items: NotificationItem[] = rawItems.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        thumbnailUrl: n.thumbnail_url,
        createdAt: n.createdAt,
        isRead: n.is_read,
        meta: n.meta ?? undefined,
    }));

    const unreadCount = items.filter((i) => !i.isRead).length;

    return { items, unreadCount };
};
export const markAdminNotificationRead = (id: string) =>
    API.patch(`/admin/notifications/${id}/read`);

export const markAdminNotificationsAllRead = () =>
    API.patch("/admin/notifications/read-all");
export const deleteAdminNotification = (id: string) =>
    API.delete(`/admin/notifications/${id}`);

export const deleteAllAdminNotifications = () =>
    API.delete("/admin/notifications");