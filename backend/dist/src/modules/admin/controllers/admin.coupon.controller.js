"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCouponController = exports.remove = exports.update = exports.create = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_coupon_service_1 = require("../services/admin.coupon.service");
// GET /admin/coupons?code=&type=&is_active=&from_date=&to_date=&page=&limit=
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { code, type, is_active, from_date, to_date, page, limit, } = req.query;
    const data = await admin_coupon_service_1.adminCouponService.list({
        code,
        type: type,
        is_active: typeof is_active === "string"
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
exports.create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const coupon = await admin_coupon_service_1.adminCouponService.create(req.body);
    return res.status(201).json({ data: coupon });
});
// PATCH /admin/coupons/:id
exports.update = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const coupon = await admin_coupon_service_1.adminCouponService.update(id, req.body);
    return res.json({ data: coupon });
});
// DELETE /admin/coupons/:id  (soft delete → is_active=false)
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const forceRaw = req.query.force;
    const force = typeof forceRaw === "string" &&
        (forceRaw === "1" || forceRaw.toLowerCase() === "true");
    const result = force
        ? await admin_coupon_service_1.adminCouponService.hardRemove(id)
        : await admin_coupon_service_1.adminCouponService.remove(id);
    return res.json({ data: result });
});
exports.adminCouponController = {
    list: exports.list,
    create: exports.create,
    update: exports.update,
    remove: exports.remove,
};
