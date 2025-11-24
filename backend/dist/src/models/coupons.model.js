"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coupon = void 0;
const mongoose_1 = require("mongoose");
exports.Coupon = (0, mongoose_1.model)('coupons', new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true, uppercase: true // không phân biệt hoa thường
    },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    max_discount: { type: Number, default: null, min: 0 },
    min_order: { type: Number, default: null, min: 0 },
    usage_limit: { type: Number, default: null, min: 0 },
    usage_turn: { type: Number, default: null, min: 0 },
    per_user_limit: { type: Number, default: null, min: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, default: null },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }));
