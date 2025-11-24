import { Schema, model, Types, Document } from "mongoose"
export interface IPromotionCoupon extends Document {
    promotion_id: Types.ObjectId
    coupon_id: Types.ObjectId
}

export const PromotionCoupon = model<IPromotionCoupon>('promotion_coupons', new Schema<IPromotionCoupon>({
    promotion_id: { type: Schema.Types.ObjectId, ref: "promotions", required: true },
    coupon_id: { type: Schema.Types.ObjectId, ref: "coupons", required: true }
}).index({promotion_id: 1, coupon_id: 1 }, {unique: true})) // đảm bảo chỉ có 1 kích thích mua hàng chỉ có 1 phiếu giảm giá