"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
// src/models/notification.model.ts
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    audience: {
        type: String,
        enum: ["user", "admin"],
        required: true,
        index: true,
    },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
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
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
