"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImage = void 0;
const mongoose_1 = require("mongoose");
exports.ProductImage = (0, mongoose_1.model)("productImages", new mongoose_1.Schema({
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true, index: true },
    variant_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "productVariants", default: null },
    url: { type: String, default: null },
    url_id: { type: String, default: null },
    position: { type: Number, default: 0 }
}, { timestamps: true }).index({
    product_id: 1, position: 1
}, { unique: true })); // cho trùng vị trí 1 sản phẩm cùng 1 vị trí
