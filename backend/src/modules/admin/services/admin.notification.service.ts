/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { Notification } from "../../../models/notification.model";
import { BadRequestException, NotFoundException } from "../../../utils/app_errol";

export const adminNotificationService = {
    async listAdminNotifications(opts: { page?: number; limit?: number }) {
        const page = Math.max(Number(opts.page) || 1, 1);
        const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Notification.find({
                audience: "admin",
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ audience: "admin" }),
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
    async deleteOne(notifId: string) {
        if (!Types.ObjectId.isValid(notifId)) {
            throw new BadRequestException("Invalid id");
        }

        await Notification.deleteOne({ _id: notifId, audience: "admin" });
        return { success: true };
    },

    async deleteAll() {
        await Notification.deleteMany({ audience: "admin" });
        return { success: true };
    },

    async markRead(notifId: string) {
        if (!Types.ObjectId.isValid(notifId)) {
            throw new BadRequestException("Invalid id");
        }

        const notif = await Notification.findOne({
            _id: notifId,
            audience: "admin",
        });

        if (!notif) {
            throw new NotFoundException("Notification not found");
        }

        if (!notif.is_read) {
            notif.is_read = true;
            await notif.save();
        }

        return { success: true };
    },

    async markAllRead() {
        await Notification.updateMany(
            { audience: "admin", is_read: false },
            { $set: { is_read: true } }
        );
        return { success: true };
    },
};
