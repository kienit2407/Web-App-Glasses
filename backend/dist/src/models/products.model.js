"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
exports.Product = (0, mongoose_1.model)("products", new mongoose_1.Schema({
    product_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    selled_amount: { type: Number, default: 0, min: 0 },
    review_count: { type: Number, default: 0, min: 0 },
    rating_avg: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    for_gender: {
        type: String,
        required: true,
        enum: ["male", "female", "unisex", "kids"],
        index: true,
    },
    thumbnail_url: { type: String, required: true, default: null },
    thumbnail_id: { type: String, required: true, default: null },
    origin_country: { type: String, default: null },
    category_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "categories", required: true, index: true },
    brand_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "brands", required: true, index: true },
    is_active: { type: Boolean, default: false, index: true }
}, { timestamps: true }).index({
    is_active: 1, // thuận lợi cho listing (chỉ lất nhưng sản phẩm là true còn hoạt động)
    category_id: 1, //đánh index 
    createdAt: -1
}));
