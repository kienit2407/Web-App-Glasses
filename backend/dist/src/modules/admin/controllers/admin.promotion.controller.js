"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromotionController = exports.relations = exports.unlinkProduct = exports.linkProduct = exports.unlinkBrand = exports.linkBrand = exports.unlinkCoupon = exports.linkCoupon = exports.remove = exports.update = exports.create = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_promotion_service_1 = require("../services/admin.promotion.service");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
// GET /admin/promotions
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { title, is_active, from_date, to_date, page, limit, } = req.query;
    const data = await admin_promotion_service_1.adminPromotionService.list({
        title,
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
// POST /admin/promotions
exports.create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { title, description, start_date, end_date, is_active, priority, discount_type, discount_value, max_discount, min_order, } = req.body;
    if (!title || !start_date || !end_date) {
        throw new app_errol_1.BadRequestException("title, start_date, end_date are required");
    }
    let banner_url;
    let banner_id;
    // nếu có gửi file banner lên thì upload Cloudinary
    if (req.file) {
        const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "promotions/banners");
        banner_url = secure_url;
        banner_id = public_id;
    }
    const promo = await admin_promotion_service_1.adminPromotionService.create({
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
exports.update = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const { title, description, start_date, end_date, is_active, priority, discount_type, discount_value, max_discount, min_order, } = req.body;
    let banner_url;
    let banner_id;
    if (req.file) {
        const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "promotions/banners");
        banner_url = secure_url;
        banner_id = public_id;
    }
    const promo = await admin_promotion_service_1.adminPromotionService.update(id, {
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
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const { force } = req.query;
    const forceBool = typeof force === "string"
        ? force === "1" || force.toLowerCase() === "true"
        : false;
    const result = await admin_promotion_service_1.adminPromotionService.remove(id, { force: forceBool });
    return res.json({ data: result });
});
// --------- link/unlink ---------
exports.linkCoupon = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, couponId } = req.params;
    if (!id || !couponId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.linkCoupon(id, couponId);
    return res.json({ data: result });
});
exports.unlinkCoupon = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, couponId } = req.params;
    if (!id || !couponId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.unlinkCoupon(id, couponId);
    return res.json({ data: result });
});
exports.linkBrand = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, brandId } = req.params;
    if (!id || !brandId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.linkBrand(id, brandId);
    return res.json({ data: result });
});
exports.unlinkBrand = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, brandId } = req.params;
    if (!id || !brandId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.unlinkBrand(id, brandId);
    return res.json({ data: result });
});
exports.linkProduct = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, productId } = req.params;
    if (!id || !productId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.linkProduct(id, productId);
    return res.json({ data: result });
});
exports.unlinkProduct = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, productId } = req.params;
    if (!id || !productId)
        throw new app_errol_1.BadRequestException("ids required");
    const result = await admin_promotion_service_1.adminPromotionService.unlinkProduct(id, productId);
    return res.json({ data: result });
});
exports.relations = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const data = await admin_promotion_service_1.adminPromotionService.getRelations(id);
    return res.json({ data });
});
exports.adminPromotionController = {
    list: exports.list,
    relations: exports.relations,
    create: exports.create,
    update: exports.update,
    remove: exports.remove,
    linkCoupon: exports.linkCoupon,
    unlinkCoupon: exports.unlinkCoupon,
    linkBrand: exports.linkBrand,
    unlinkBrand: exports.unlinkBrand,
    linkProduct: exports.linkProduct,
    unlinkProduct: exports.unlinkProduct,
};
