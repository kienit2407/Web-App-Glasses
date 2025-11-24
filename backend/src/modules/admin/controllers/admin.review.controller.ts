// src/controllers/admin_review.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminReviewService } from "../services/admin.review.service";

// GET /admin/reviews?product_id=&user_id=&rating=&page=&limit=
export const list = TryCatch(async (req: Request, res: Response) => {
    const {
        product_id, // lọc theo product
        user_id, // lọc theo user
        product_name,
        user_name,
        rating,
        page,
        limit,
    } = req.query as any

    const data = await adminReviewService.list({
        product_id,
        user_id,
        product_name,
        user_name,
        rating: rating ? Number(rating) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });

    return res.json({ data });
});

// DELETE /admin/reviews/:id
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestException("id is required");
    }

    const result = await adminReviewService.remove(id);

    return res.json({ data: result });
});

export const adminReviewController = {
    list,
    remove,
};
