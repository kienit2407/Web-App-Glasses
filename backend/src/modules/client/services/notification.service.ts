/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { Notification } from "../../../models/notification.model";
import { BadRequestException, NotFoundException } from "../../../utils/app_errol";

export const userNotificationService = {
    async listUserNotifications(
        userId: Types.ObjectId,
        opts: { page?: number; limit?: number }
    ) {
        const page = Math.max(Number(opts.page) || 1, 1);
        const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Notification.find({
                audience: "user",
                user_id: userId,
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ audience: "user", user_id: userId }),
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
    async deleteOne(userId: Types.ObjectId, notifId: string) {
        if (!Types.ObjectId.isValid(notifId)) {
            throw new BadRequestException("Invalid id");
        }

        await Notification.deleteOne({
            _id: notifId,
            audience: "user",
            user_id: userId,
        });

        return { success: true };
    },

    async deleteAll(userId: Types.ObjectId) {
        await Notification.deleteMany({
            audience: "user",
            user_id: userId,
        });
        return { success: true };
    },
    async markRead(userId: Types.ObjectId, notifId: string) {
        if (!Types.ObjectId.isValid(notifId)) {
            throw new BadRequestException("Invalid id");
        }

        const notif = await Notification.findOne({
            _id: notifId,
            audience: "user",
            user_id: userId,
        });

        if (!notif) {
            throw new NotFoundException("Notification not found");
        }

        notif.is_read = true;
        await notif.save();

        return { success: true };
    },

    async markAllRead(userId: Types.ObjectId) {
        await Notification.updateMany(
            { audience: "user", user_id: userId, is_read: false },
            { $set: { is_read: true } }
        );
        return { success: true };
    },
};
