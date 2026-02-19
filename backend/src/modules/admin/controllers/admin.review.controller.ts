import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException, UnauthorizedException } from "../../../utils/app_errol";
import { adminReviewService } from "../services/admin.review.service";

// GET /admin/reviews?product_id=&user_id=&rating=&page=&limit=
export const list = TryCatch(async (req: Request, res: Response) => {
    const { product_id, user_id, product_name, user_name, rating, page, limit } = req.query as any;

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
    if (!id) throw new BadRequestException("id is required");

    const result = await adminReviewService.remove(id);
    return res.json({ data: result });
});

//  PATCH /admin/reviews/:id/reply
export const upsertReply = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content } = req.body as any;

    if (!id) throw new BadRequestException("id is required");
    if (!content || !String(content).trim()) throw new BadRequestException("content is required");

    // NOTE: tuỳ middleware auth admin của bạn:
    // - nếu admin nằm trong req.user
    // - hoặc req.admin
    const adminId = (req as any).user?._id || (req as any).admin?._id;
    if (!adminId) throw new UnauthorizedException("Unauthorized");

    const result = await adminReviewService.upsertReply(id, adminId, String(content).trim());
    return res.json({ data: result });
});

// ✅ DELETE /admin/reviews/:id/reply
export const removeReply = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const adminId = (req as any).user?._id || (req as any).admin?._id;
    if (!adminId) throw new UnauthorizedException("Unauthorized");

    const result = await adminReviewService.removeReply(id, adminId);
    return res.json({ data: result });
});

export const adminReviewController = {
    list,
    remove,
    upsertReply,
    removeReply,
};
