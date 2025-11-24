import { Schema, model, Types, Document } from "mongoose"
export interface IPromotionBrand extends Document {
    promotion_id: Types.ObjectId
    brand_id: Types.ObjectId
}

export const PromotionBrand = model<IPromotionBrand>('promotion_brands', new Schema<IPromotionBrand>({
    promotion_id: { type: Schema.Types.ObjectId, ref: "promotions", required: true },
    brand_id: { type: Schema.Types.ObjectId, ref: "brands", required: true }
}).index({ promotion_id: 1, brand_id: 1 }, { unique: true })) // đảm bảo chỉ có 1 kích thích mua hàng chỉ có 1 phiếu giảm giá