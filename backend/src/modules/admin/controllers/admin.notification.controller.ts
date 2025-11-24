import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { adminNotificationService } from "../services/admin.notification.service";

// GET /admin/notifications?page=&limit=
export const list = TryCatch(async (req: Request, res: Response) => {
    // đã có protectAdminRoute ở router
    const { page = "1", limit = "20" } = req.query as {
        page?: string;
        limit?: string;
    };

    const data = await adminNotificationService.listAdminNotifications({
        page: Number(page),
        limit: Number(limit),
    });

    return res.json({ data });
});
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await adminNotificationService.deleteOne(id);
    return res.json({ data });
});

export const removeAll = TryCatch(async (_req: Request, res: Response) => {
    const data = await adminNotificationService.deleteAll();
    return res.json({ data });
});
export const markRead = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await adminNotificationService.markRead(id);
    return res.json({ data });
});

export const markAllRead = TryCatch(async (_req: Request, res: Response) => {
    const data = await adminNotificationService.markAllRead();
    return res.json({ data });
});
export const adminNotificationController = {
    list,
    remove,
    removeAll,
    markRead,
    markAllRead
};
