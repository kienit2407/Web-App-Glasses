import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminCouponService } from "../services/admin.coupon.service";

// GET /admin/coupons?code=&type=&is_active=&from_date=&to_date=&page=&limit=
export const list = TryCatch(async (req: Request, res: Response) => {
    const {
        code,
        type,
        is_active,
        from_date,
        to_date,
        page,
        limit,
    } = req.query as {
        code?: string;
        type?: any;
        is_active?: string;
        from_date?: string;
        to_date?: string;
        page?: string;
        limit?: string;
    };

    const data = await adminCouponService.list({
        code,
        type: type as any,
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

// POST /admin/coupons
export const create = TryCatch(async (req: Request, res: Response) => {
    const coupon = await adminCouponService.create(req.body);
    return res.status(201).json({ data: coupon });
});

// PATCH /admin/coupons/:id
export const update = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const coupon = await adminCouponService.update(id, req.body);
    return res.json({ data: coupon });
});

// DELETE /admin/coupons/:id  (soft delete → is_active=false)
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const forceRaw = req.query.force;
    const force =
        typeof forceRaw === "string" &&
        (forceRaw === "1" || forceRaw.toLowerCase() === "true");

    const result = force
        ? await adminCouponService.hardRemove(id)
        : await adminCouponService.remove(id);

    return res.json({ data: result });
});


export const adminCouponController = {
    list,
    create,
    update,
    remove,
};
