// src/modules/client/controllers/support.controller.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { supportUserService } from "../services/support.service";

export const sendMessage = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new BadRequestException("Unauthorized");

    const userId = new Types.ObjectId(req.user._id);
    const { content } = req.body as { content?: string };

    const data = await supportUserService.sendUserMessage(userId, {
        content: content || "",
    });

    return res.status(201).json({ data });
});

export const listMyConversations = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) throw new BadRequestException("Unauthorized");

        const userId = new Types.ObjectId(req.user._id);
        const data = await supportUserService.listMyConversations(userId);
        return res.json({ data });
    }
);

export const listMyMessages = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) throw new BadRequestException("Unauthorized");

    const userId = new Types.ObjectId(req.user._id);
    const { id } = req.params; // conversationId

    const data = await supportUserService.listMessagesForUser(userId, id);
    return res.json({ data });
});
export const sendMediaMessage = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) throw new BadRequestException("Unauthorized");

        const userId = new Types.ObjectId(req.user._id);
        const file = (req).file;

        const data = await supportUserService.sendUserMediaMessage(userId, file!);

        return res.status(201).json({ data });
    }
);
export const supportUserController = {
    sendMessage,
    sendMediaMessage,
    listMyConversations,
    listMyMessages,
};
