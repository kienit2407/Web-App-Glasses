// src/models/notification.model.ts
import { Schema, model, Types, Document } from "mongoose";

export type TNotificationAudience = "user" | "admin";

export type TNotificationCategory = "order" | "system";

export type TNotificationType =
    | "admin:new_order"
    | "admin:cancel_requested"
    | "admin:return_requested"
    | "user:order_created"
    | "user:order_status_updated"
    | "user:order_cancel_requested"
    | "user:order_return_requested"
    | "system";

export type TNotificationMeta = {
    order_id?: Types.ObjectId;
    order_number?: string;
    total_amount?: number;
    new_status?: string;
    new_status_label?: string;
};

export interface INotification extends Document {
    audience: TNotificationAudience;
    user_id?: Types.ObjectId | null;
    category: TNotificationCategory;
    type: TNotificationType;
    title: string;
    message: string;
    thumbnail_url?: string | null;
    is_read: boolean;
    meta?: TNotificationMeta;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        audience: {
            type: String,
            enum: ["user", "admin"],
            required: true,
            index: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "users",
            index: true,
        },
        category: {
            type: String,
            enum: ["order", "system"],
            default: "order",
            index: true,
        },
        type: {
            type: String,
            enum: [
                "admin:new_order",
                "admin:cancel_requested",
                "admin:return_requested",
                "user:order_created",
                "user:order_status_updated",
                "user:order_cancel_requested",
                "user:order_return_requested",
                "system",
            ],
            required: true,
            index: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        thumbnail_url: { type: String, default: null },
        is_read: {
            type: Boolean,
            default: false,
            index: true,
        },
        meta: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({
    audience: 1,
    user_id: 1,
    is_read: 1,
    createdAt: -1,
});

notificationSchema.index({
    audience: 1,
    category: 1,
    createdAt: -1,
});

export const Notification = model<INotification>(
    "Notification",
    notificationSchema
);
