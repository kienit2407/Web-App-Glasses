"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
// src/models/orders.model.ts
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    order_number: { type: String, required: true, unique: true, index: true, trim: true },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    order_status: {
        type: String,
        enum: ["pending", "processing", "shipping", "delivering", "delivered", "cancelled", "returned"],
        default: "pending",
        index: true,
    },
    payment_status: {
        type: String,
        enum: ["pending", "success", "failed", "refunded"],
        default: "pending",
        index: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount_amount: { type: Number, required: true, min: 0 },
    shipping_fee: { type: Number, required: true, min: 0, default: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    coupon_code: { type: String, default: null },
    note: { type: String, default: null },
    shipping_address: {
        recipient_name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        province_code: { type: String, required: true, trim: true },
        district_code: { type: String, required: true, trim: true },
        ward_code: { type: String, required: true, trim: true },
        specific_address: { type: String, required: true, trim: true },
    },
    // NEW flags
    cancel_requested: { type: Boolean, default: false, index: true },
    return_requested: { type: Boolean, default: false, index: true },
}, { timestamps: true });
orderSchema.index({ user_id: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)("orders", orderSchema);
