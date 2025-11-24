// src/modules/client/controllers/checkout.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { checkoutService } from "../services/checkout.service";

export const preview = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    const { cart_item_ids, items, address_id, coupon_code } = req.body as {
        cart_item_ids?: string[];
        items?: { variant_id: string; quantity: number }[];
        address_id?: string;
        coupon_code?: string | null;
    };

    if (!address_id) {
        throw new BadRequestException("address_id is required");
    }

    const hasCartItems =
        Array.isArray(cart_item_ids) && cart_item_ids.length > 0;
    const hasDirectItems =
        Array.isArray(items) && items.length > 0;

    if (!hasCartItems && !hasDirectItems) {
        // Không truyền gì cả
        throw new BadRequestException("cart_item_ids or items is required");
    }

    const userId = new Types.ObjectId(req.user._id);

    const data = await checkoutService.preview(userId, {
        cart_item_ids: hasCartItems ? cart_item_ids : undefined,
        items: hasDirectItems ? items : undefined,
        address_id,
        coupon_code: coupon_code ?? null,
    });

    return res.json({ data });
});

export const checkoutController = {
    preview,
};
