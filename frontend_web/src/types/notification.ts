// src/types/notification.ts
export type NotificationType =
    | "admin:new_order"
    | "admin:cancel_requested"
    | "admin:return_requested"
    | "user:order_created"
    | "user:order_status_updated"
    | "user:order_cancel_requested"
    | "user:order_return_requested"
    | "chat:message"
    | "system";

export interface NotificationMeta {
    order_id?: string;
    order_number?: string;
    total_amount?: number;
    new_status?: string;
    new_status_label?: string
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    thumbnailUrl?: string | null;
    createdAt: string;
    isRead: boolean;
    meta?: NotificationMeta;
}