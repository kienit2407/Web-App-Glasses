import { Schema, model, Types, Document } from "mongoose"

export interface ICartDetail extends Document {
    cart_id: Types.ObjectId
    variant_id: Types.ObjectId
    price_at_add: number // giá tại thời điểm thêm
    quantity: number
    createdAt: Date
    updatedAt: Date
}

export const CartDetail = model<ICartDetail>('cart_details', new Schema<ICartDetail>({
    cart_id: { type: Schema.Types.ObjectId, ref: "carts", required: true, index: true },
    variant_id: { type: Schema.Types.ObjectId, ref: "product_variants", required: true, index: true },
    price_at_add: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}).index({ 
    cart_id: 1, 
    variant_id: 1 
}, {unique: true} // không cho trùng 1 variant trong cùng một giỏ hàng => nó sẽ bị gộp thành 1 sản phẩm và tăng số lượng lên 2
))