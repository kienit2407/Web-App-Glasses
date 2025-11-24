// src/models/user.promotion.views.ts
import { Schema, model, Types, Document } from "mongoose";

export interface IUserPromotionView extends Document {
    user_id: Types.ObjectId;
    promotion_id: Types.ObjectId;
    seen_at: Date;
}

const UserPromotionViewSchema = new Schema<IUserPromotionView>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
    },
    promotion_id: {
        type: Schema.Types.ObjectId,
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
UserPromotionViewSchema.index(
    { user_id: 1, promotion_id: 1 },
    { unique: true }
);

export const UserPromotionView = model<IUserPromotionView>(
    "user_promotion_views",
    UserPromotionViewSchema
);
