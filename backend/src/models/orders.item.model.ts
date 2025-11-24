import { Schema, model, Types, Document } from "mongoose"

export interface IOrderItem extends Document {
    order_id: Types.ObjectId
    product_id: Types.ObjectId
    variant_id: Types.ObjectId
    sku?: string | null
    name: string         // snapshot lại tên sản phẩm
    attributes?: any     // snapshot lại thuộc tính của sản phẩm
    unit_price: number
    quantity: number
    total: number
    createdAt: Date
    updatedAt: Date
}

export const OrderItem = model<IOrderItem>('order_items', new Schema<IOrderItem>({
    order_id: { type: Schema.Types.ObjectId, ref: "orders", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "products", required: true },
    variant_id: { type: Schema.Types.ObjectId, ref: "product_variants", required: true, index: true },
    sku: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    attributes: { type: Schema.Types.Mixed, default: null },
    unit_price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 }
}))