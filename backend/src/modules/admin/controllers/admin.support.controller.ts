// src/modules/admin/controllers/admin.support.controller.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { supportAdminService } from "../services/admin.support.service";

export const listConversations = TryCatch(
    async (_req: Request, res: Response) => {
        const data = await supportAdminService.listConversationsForAdmin();
        return res.json({ data });
    }
);

export const listMessages = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params; // conversation id
    const data = await supportAdminService.listMessagesForAdmin(id);
    return res.json({ data });
});

export const deleteConversation = TryCatch(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const data = await supportAdminService.deleteConversationForAdmin(id);
        return res.json({ data });
    }
);

export const sendAdminMessage = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) throw new BadRequestException("Unauthorized");

        const adminId = new Types.ObjectId(req.user._id);
        const { id } = req.params; // conversation id
        const { content } = req.body as { content?: string };

        const data = await supportAdminService.sendAdminMessage(adminId, id, {
            content: content || "",
        });

        return res.status(201).json({ data });
    }
);
export const sendAdminMediaMessage = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) throw new BadRequestException("Unauthorized");

        const adminId = new Types.ObjectId(req.user._id);
        const { id } = req.params;
        const file = (req).file;

        const data = await supportAdminService.sendAdminMediaMessage(
            adminId,
            id,
            file!
        );

        return res.status(201).json({ data });
    }
);

export const closeConversation = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) throw new BadRequestException("Unauthorized");

        const adminId = new Types.ObjectId(req.user._id);
        const { id } = req.params;

        const data = await supportAdminService.closeConversation(adminId, id);
        return res.json({ data });
    }
);

export const supportAdminController = {
    listConversations,
    listMessages,
    sendAdminMessage,
    closeConversation,
    deleteConversation,
    sendAdminMediaMessage
};
