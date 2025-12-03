"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminNotificationService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const notification_model_1 = require("../../../models/notification.model");
const app_errol_1 = require("../../../utils/app_errol");
exports.adminNotificationService = {
    async listAdminNotifications(opts) {
        const page = Math.max(Number(opts.page) || 1, 1);
        const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            notification_model_1.Notification.find({
                audience: "admin",
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            notification_model_1.Notification.countDocuments({ audience: "admin" }),
        ]);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
            },
        };
    },
    async deleteOne(notifId) {
        if (!mongoose_1.Types.ObjectId.isValid(notifId)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        await notification_model_1.Notification.deleteOne({ _id: notifId, audience: "admin" });
        return { success: true };
    },
    async deleteAll() {
        await notification_model_1.Notification.deleteMany({ audience: "admin" });
        return { success: true };
    },
    async markRead(notifId) {
        if (!mongoose_1.Types.ObjectId.isValid(notifId)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const notif = await notification_model_1.Notification.findOne({
            _id: notifId,
            audience: "admin",
        });
        if (!notif) {
            throw new app_errol_1.NotFoundException("Notification not found");
        }
        if (!notif.is_read) {
            notif.is_read = true;
            await notif.save();
        }
        return { success: true };
    },
    async markAllRead() {
        await notification_model_1.Notification.updateMany({ audience: "admin", is_read: false }, { $set: { is_read: true } });
        return { success: true };
    },
};
