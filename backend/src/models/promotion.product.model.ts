import { Schema, model, Types, Document } from "mongoose"

export interface IPromotionProduct extends Document {
    promotion_id: Types.ObjectId
    product_id: Types.ObjectId
}
export const PromotionProduct = model<IPromotionProduct>('promotion_products', new Schema<IPromotionProduct>({
    promotion_id: { type: Schema.Types.ObjectId, ref: "promotions", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "products", required: true }
}).index({ promotion_id: 1, product_id: 1 }, { unique: true })) // đảm bảo chỉ có 1 kích thích mua hàng chỉ có 1 phiếu giảm giá
