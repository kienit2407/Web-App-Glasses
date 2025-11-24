"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariant = void 0;
const mongoose_1 = require("mongoose");
exports.ProductVariant = (0, mongoose_1.model)("productVariants", new mongoose_1.Schema({
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true, index: true },
    sku_variant: { type: String, required: true, unique: true, trim: true, index: true },
    frame_material: { type: String, required: true, trim: true },
    frame_color: { type: String, required: true, trim: true },
    frame_shape: { type: String, required: true, trim: true },
    lens_width: { type: String, required: true, trim: true },
    lens_height: { type: String, required: true, trim: true },
    temple_length: { type: String, required: true, trim: true },
    bridge_width: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    has_uv_protection: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    original_price: { type: Number, default: null, min: 0 },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }));
