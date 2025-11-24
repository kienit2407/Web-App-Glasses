"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImage = void 0;
const mongoose_1 = require("mongoose");
exports.ProductImage = (0, mongoose_1.model)("product_images", new mongoose_1.Schema({
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true },
    variant_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "product_variants", default: null },
    url: { type: String, default: null },
    url_id: { type: String, default: null },
    position: { type: Number, default: 0 }
}, { timestamps: true })
    .index({ product_id: 1 })
    .index({
    variant_id: 1,
    position: 1 //để một product có nhiều ảnh (0,1,2,…) nhưng mỗi position chỉ có một ảnh.
}, { unique: true }));
