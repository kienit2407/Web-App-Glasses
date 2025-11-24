// src/modules/client/controllers/promotion.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import {
    BadRequestException,
    UnauthorizedException,
} from "../../../utils/app_errol";
import { promotionService } from "../services/promotion.service";

export const listCenter = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }
    const userId = new Types.ObjectId(req.user._id);

    const items = await promotionService.listForCenter(userId);

    return res.json({ data: { items } });
});

export const getHighlight = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }
    const userId = new Types.ObjectId(req.user._id);

    const data = await promotionService.getHighlight(userId);
    return res.json({ data });
});

export const markHighlightSeen = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) {
            throw new UnauthorizedException("Unauthorized");
        }
        const userId = new Types.ObjectId(req.user._id);
        const { id } = req.params;
        if (!id) throw new BadRequestException("promotion id is required");

        const data = await promotionService.markHighlightSeen(userId, id);
        return res.json({ data });
    }
);

export const promotionController = {
    listCenter,
    getHighlight,
    markHighlightSeen,
};
