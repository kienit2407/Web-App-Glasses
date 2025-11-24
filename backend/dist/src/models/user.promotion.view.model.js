"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPromotionView = void 0;
// src/models/user.promotion.views.ts
const mongoose_1 = require("mongoose");
const UserPromotionViewSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
    },
    promotion_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "promotions",
        required: true,
        index: true,
    },
    seen_at: {
        type: Date,
        default: () => new Date(),
    },
});
// mỗi user chỉ có 1 record / 1 promotion
UserPromotionViewSchema.index({ user_id: 1, promotion_id: 1 }, { unique: true });
exports.UserPromotionView = (0, mongoose_1.model)("user_promotion_views", UserPromotionViewSchema);
