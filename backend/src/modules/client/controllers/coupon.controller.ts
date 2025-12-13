// src/modules/client/controllers/coupon.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import {
    BadRequestException,
    UnauthorizedException,
} from "../../../utils/app_errol";
import { couponService } from "../services/coupon.service";

// GET /coupons  -> Coupon Center
export const listAvailable = TryCatch(async (req: Request, res: Response) => {
    // if (!req.user?._id) {
    //     throw new UnauthorizedException("Unauthorized");
    // }
    // const userId = new Types.ObjectId(req.user._id);
    const userId = req.user && req.user._id 
        ? new Types.ObjectId(req.user._id) 
        : undefined
     console.log(userId)
    const items = await couponService.listAvailableForUser(userId);

    return res.json({ data: { items } });
});

// GET /coupons/:code/check
export const check = TryCatch(async (req: Request, res: Response) => {
    const { code } = req.params;
    if (!code) {
        throw new BadRequestException("Coupon code is required");
    }

    const userId = req.user?._id ? new Types.ObjectId(req.user._id) : null;

    const subtotalRaw = req.query.subtotal;
    const subtotal =
        typeof subtotalRaw === "string" ? Number(subtotalRaw) : undefined;

    const data = await couponService.checkCoupon(userId, code, subtotal);
    return res.json({ data });
});

// POST /coupons/claim/:code
export const claim = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { code } = req.params;
    if (!code) {
        throw new BadRequestException("Coupon code is required");
    }

    const userId = new Types.ObjectId(req.user._id);
    const data = await couponService.claim(userId, code);

    return res.status(201).json({ data });
});

export const couponController = {
    listAvailable,
    check,
    claim,
};
