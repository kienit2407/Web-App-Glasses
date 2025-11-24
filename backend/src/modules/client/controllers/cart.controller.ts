
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from "../../../utils/app_errol";
import { cartService } from "../services/cart.service";

// GET /cart
export const getMyCart = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const userId = req.user._id
    const cart = await cartService.getMyCart(userId);

    return res.json({ data: cart });
});

export const addItem = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { variant_id, quantity } = req.body;

    if (!variant_id) {
        throw new BadRequestException("Chưa có sản phẩm nào được chọn");
    }

    const userId = req.user._id

    try {
        const cart = await cartService.addItem(userId, {
            variant_id,
            quantity,
        });

        return res.status(201).json({ data: cart });
    } catch (err: any) {
        throw new BadRequestException(err.message || "Cannot add item to cart");
    }
});


export const updateItem = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
        throw new BadRequestException("quantity is required");
    }

    const userId = req.user._id

    try {
        const cart = await cartService.updateItem(userId, itemId, { quantity });

        return res.json({ data: cart });
    } catch (err: any) {
        if (err.message === "Cart item not found") {
            throw new NotFoundException(err.message);
        }
        throw new BadRequestException(err.message || "Cannot update cart item");
    }
});

// DELETE /cart/items/:itemId
export const removeItem = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { itemId } = req.params;
    const userId = new Types.ObjectId(req.user._id);

    const cart = await cartService.removeItem(userId, itemId);

    return res.json({ data: cart });
});

export const cartController = {
    getMyCart,
    addItem,
    updateItem,
    removeItem,
};
