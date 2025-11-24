"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
exports.Review = (0, mongoose_1.model)('reviews', new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    images: [
        {
            url: String,
            url_id: String, // public_id của cloudinary (hoặc tương đương)
        },
    ],
    comment: { type: String, required: true, trim: true },
    video_url: { type: String, default: null },
    is_edited: { type: Boolean, default: false },
}, { timestamps: true }).index({
    user_id: 1,
    product_id: 1
}, { unique: true } // mỗi user chỉ được đánh giá 1 sản phẩm
));
