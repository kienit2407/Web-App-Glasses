// src/controllers/admin_promotion.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminPromotionService } from "../services/admin.promotion.service";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";

// GET /admin/promotions
export const list = TryCatch(async (req: Request, res: Response) => {
    const {
        title,
        is_active,
        from_date,
        to_date,
        page,
        limit,
    } = req.query as {
        title?: string;
        is_active?: string;
        from_date?: string;
        to_date?: string;
        page?: string;
        limit?: string;
    };

    const data = await adminPromotionService.list({
        title,
        is_active:
            typeof is_active === "string"
                ? is_active === "1" || is_active.toLowerCase() === "true"
                : undefined,
        from_date,
        to_date,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });

    return res.json({ data });
});

// POST /admin/promotions
export const create = TryCatch(async (req: Request, res: Response) => {
    const {
        title,
        description,
        start_date,
        end_date,
        is_active,
        priority,

        discount_type,
        discount_value,
        max_discount,
        min_order,
    } = req.body;
    if (!title || !start_date || !end_date) {
        throw new BadRequestException("title, start_date, end_date are required");
    }

    let banner_url: string | undefined;
    let banner_id: string | undefined;

    // nếu có gửi file banner lên thì upload Cloudinary
    if (req.file) {
        const { secure_url, public_id } = await uploadImageBuffer(
            req.file.buffer,
            "promotions/banners"
        );
        banner_url = secure_url;
        banner_id = public_id;
    }
    const promo = await adminPromotionService.create({
        title,
        description,
        banner_url,
        banner_id,
        start_date,
        end_date,
        is_active: typeof is_active === "string"
            ? is_active === "true"
            : is_active,
        priority: priority ? Number(priority) : undefined,

        discount_type,
        discount_value: discount_value,
        max_discount: max_discount != null ? Number(max_discount) : undefined,
        min_order: min_order != null ? Number(min_order) : undefined,
    });

    return res.status(201).json({ data: promo });
});

// PATCH /admin/promotions/:id
export const update = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const {
        title,
        description,
        start_date,
        end_date,
        is_active,
        priority,

        discount_type,
        discount_value,
        max_discount,
        min_order,
    } = req.body;

    let banner_url: string | undefined;
    let banner_id: string | undefined;

    if (req.file) {
        const { secure_url, public_id } = await uploadImageBuffer(
            req.file.buffer,
            "promotions/banners"
        );
        banner_url = secure_url;
        banner_id = public_id;
    }

    const promo = await adminPromotionService.update(id, {
        title,
        description,
        banner_url,
        banner_id,
        start_date,
        end_date,
        is_active: typeof is_active === "string"
            ? is_active === "true"
            : is_active,
        priority: priority ? Number(priority) : undefined,

        discount_type,
        discount_value: discount_value != null ? Number(discount_value) : undefined,
        max_discount: max_discount != null ? Number(max_discount) : undefined,
        min_order: min_order != null ? Number(min_order) : undefined,
    });

    return res.json({ data: promo });
});


// DELETE /admin/promotions/:id
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const { force } = req.query;
    const forceBool =
        typeof force === "string"
            ? force === "1" || force.toLowerCase() === "true"
            : false;

    const result = await adminPromotionService.remove(id, { force: forceBool });
    return res.json({ data: result });
});

// --------- link/unlink ---------

export const linkCoupon = TryCatch(async (req: Request, res: Response) => {
    const { id, couponId } = req.params;
    if (!id || !couponId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.linkCoupon(id, couponId);
    return res.json({ data: result });
});

export const unlinkCoupon = TryCatch(async (req: Request, res: Response) => {
    const { id, couponId } = req.params;
    if (!id || !couponId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.unlinkCoupon(id, couponId);
    return res.json({ data: result });
});

export const linkBrand = TryCatch(async (req: Request, res: Response) => {
    const { id, brandId } = req.params;
    if (!id || !brandId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.linkBrand(id, brandId);
    return res.json({ data: result });
});

export const unlinkBrand = TryCatch(async (req: Request, res: Response) => {
    const { id, brandId } = req.params;
    if (!id || !brandId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.unlinkBrand(id, brandId);
    return res.json({ data: result });
});

export const linkProduct = TryCatch(async (req: Request, res: Response) => {
    const { id, productId } = req.params;
    if (!id || !productId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.linkProduct(id, productId);
    return res.json({ data: result });
});

export const unlinkProduct = TryCatch(async (req: Request, res: Response) => {
    const { id, productId } = req.params;
    if (!id || !productId) throw new BadRequestException("ids required");

    const result = await adminPromotionService.unlinkProduct(id, productId);
    return res.json({ data: result });
});
export const relations = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const data = await adminPromotionService.getRelations(id);
    return res.json({ data });
});
export const adminPromotionController = {
    list,
    relations,
    create,
    update,
    remove,
    linkCoupon,
    unlinkCoupon,
    linkBrand,
    unlinkBrand,
    linkProduct,
    unlinkProduct,
};
