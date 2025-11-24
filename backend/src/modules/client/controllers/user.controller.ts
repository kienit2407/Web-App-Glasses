// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import { userService } from "../services/user.service";
import { BadRequestException, UnauthorizedException } from "../../../utils/app_errol";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";
import { couponService } from "../services/coupon.service";

export const getMe = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    // req.user do middleware inject, đã loại hashed_password rồi
    // Nếu bạn muốn luôn lấy bản mới nhất từ DB thì có thể gọi userService.getById
    return res.json({ data: req.user });
});
export const listMyCoupons = TryCatch(async (req, res) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const userId = new Types.ObjectId(req.user._id);

    const subtotalRaw = req.query.subtotal;
    const subtotal =
        typeof subtotalRaw === "string" ? Number(subtotalRaw) : undefined;

    const items = await couponService.listMyCoupons(userId, subtotal);

    return res.json({ data: { items } });
});
export const updateMe = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized");
    }

    const userId = new Types.ObjectId(req.user._id);
    const { display_name } = req.body;

    let avatar_url: string | undefined;
    let avatar_id: string | undefined;

    // Nếu FE upload file mới → upload Cloudinary
    if (req.file) {
        const { secure_url, public_id } = await uploadImageBuffer(
            req.file.buffer,
            "users/avatars"
        );
        avatar_url = secure_url;
        avatar_id = public_id;
    }

    const user = await userService.updateMe(userId, {
        display_name,
        avatar_url,
        avatar_id,
    });

    return res.json({ data: user });
});

export const changePassword = TryCatch(
    async (req: Request, res: Response) => {
        if (!req.user?._id) {
            throw new BadRequestException("Unauthorized");
        }

        const userId = new Types.ObjectId(req.user._id);

        const { current_password, new_password, confirm_password } = req.body as {
            current_password?: string;
            new_password?: string;
            confirm_password?: string;
        };

        if (!current_password || !new_password || !confirm_password) {
            throw new BadRequestException(
                "current_password, new_password and confirm_password are required"
            );
        }

        if (new_password !== confirm_password) {
            throw new BadRequestException("Confirm password does not match");
        }

        await userService.changePassword(userId, {
            current_password,
            new_password,
        });

        return res.json({
            message: "Password changed successfully",
        });
    }
);

export const userController = {
    getMe,
    updateMe,
    changePassword,
    listMyCoupons
};
