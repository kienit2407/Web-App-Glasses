"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promotion = void 0;
const mongoose_1 = require("mongoose");
exports.Promotion = (0, mongoose_1.model)('promotions', new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    banner_url: { type: String, default: null },
    banner_id: { type: String, default: null },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["percent", "fixed"], required: true },
    discount_value: { type: Number, required: true, min: 0 },
    max_discount: { type: Number, default: null, min: 0 },
    min_order: { type: Number, default: null, min: 0 },
}, { timestamps: true }));
