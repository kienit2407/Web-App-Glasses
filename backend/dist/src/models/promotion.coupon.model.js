"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionCoupon = void 0;
const mongoose_1 = require("mongoose");
exports.PromotionCoupon = (0, mongoose_1.model)('promotion_coupons', new mongoose_1.Schema({
    promotion_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "promotions", required: true },
    coupon_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "coupons", required: true }
}).index({ promotion_id: 1, coupon_id: 1 }, { unique: true })); // đảm bảo chỉ có 1 kích thích mua hàng chỉ có 1 phiếu giảm giá
