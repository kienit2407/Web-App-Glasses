import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { userNotificationService } from "../services/notification.service";

// GET /notifications?page=&limit=
export const list = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    const userId = new Types.ObjectId(req.user._id);
    const { page = "1", limit = "20" } = req.query as {
        page?: string;
        limit?: string;
    };

    const data = await userNotificationService.listUserNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
    });

    return res.json({ data });
});
export const remove = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new BadRequestException("Unauthorized");
    const userId = new Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await userNotificationService.deleteOne(userId, id);
    return res.json({ data });
});

export const removeAll = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new BadRequestException("Unauthorized");
    const userId = new Types.ObjectId(req.user._id);
    const data = await userNotificationService.deleteAll(userId);
    return res.json({ data });
});
// PATCH /notifications/:id/read
export const markRead = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    const userId = new Types.ObjectId(req.user._id);
    const { id } = req.params;

    const data = await userNotificationService.markRead(userId, id);

    return res.json({ data });
});

// PATCH /notifications/read-all
export const markAllRead = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    const userId = new Types.ObjectId(req.user._id);
    const data = await userNotificationService.markAllRead(userId);

    return res.json({ data });
});

export const userNotificationController = {
    list,
    markRead,
    markAllRead,
    remove,
    removeAll
};
