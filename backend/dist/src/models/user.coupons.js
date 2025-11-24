"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCoupon = void 0;
const mongoose_1 = require("mongoose");
exports.UserCoupon = (0, mongoose_1.model)('user_coupons', new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    coupon_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "coupons", required: true, index: true },
    saved_at: { type: Date, default: () => new Date() },
    is_saved: { type: Boolean, default: false },
    used_order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "orders", default: null },
    is_used: { type: Boolean, default: false }
}).index({
    user_id: 1,
    coupon_id: 1 // mỗi user chỉ được lưu 1 lần vouchers
}, { unique: true }));
