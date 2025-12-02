// src/modules/chat/chat.controller.ts
import { Request, Response } from "express";
import { BadRequestException } from "../../../utils/app_errol";
import { TryCatch } from "../../../utils/try_catch";
import { ChatHistoryTurn, chatWithCustomer } from "../services/chat.service";
export const chatController = {
    chat: TryCatch(async (req: Request, res: Response) => {
        const { message, history } = req.body as {
            message?: string;
            history?: ChatHistoryTurn[];
        };

        if (!message || !message.trim()) {
            throw new BadRequestException("Message is required");
        }

        const result = await chatWithCustomer(
            message.trim(),
            Array.isArray(history) ? history : [],
        );

        return res.json({ data: result });
    }),
};