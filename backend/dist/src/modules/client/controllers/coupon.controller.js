"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponController = exports.claim = exports.check = exports.listAvailable = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const coupon_service_1 = require("../services/coupon.service");
// GET /coupons  -> Coupon Center
exports.listAvailable = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const items = await coupon_service_1.couponService.listAvailableForUser(userId);
    return res.json({ data: { items } });
});
// GET /coupons/:code/check
exports.check = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { code } = req.params;
    if (!code) {
        throw new app_errol_1.BadRequestException("Coupon code is required");
    }
    const userId = req.user?._id ? new mongoose_1.Types.ObjectId(req.user._id) : null;
    const subtotalRaw = req.query.subtotal;
    const subtotal = typeof subtotalRaw === "string" ? Number(subtotalRaw) : undefined;
    const data = await coupon_service_1.couponService.checkCoupon(userId, code, subtotal);
    return res.json({ data });
});
// POST /coupons/claim/:code
exports.claim = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { code } = req.params;
    if (!code) {
        throw new app_errol_1.BadRequestException("Coupon code is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await coupon_service_1.couponService.claim(userId, code);
    return res.status(201).json({ data });
});
exports.couponController = {
    listAvailable: exports.listAvailable,
    check: exports.check,
    claim: exports.claim,
};
