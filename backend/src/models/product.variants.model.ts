import { Schema, model, Types, Document } from "mongoose"

export interface IProductVariant extends Document {
    product_id: Types.ObjectId
    sku_variant: string
    frame_material: string
    frame_color: string
    frame_shape: string
    lens_width: string
    lens_height: string
    temple_length: string
    bridge_width: string
    stock: number
    has_uv_protection: boolean
    price: number //// giá niêm yết / giá gốc
    sale_price?: number | null // giá khuyến mãi hiện tại   
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}


export const ProductVariant = model<IProductVariant>("product_variants", new Schema<IProductVariant>({
    product_id: { type: Schema.Types.ObjectId, ref: "products", required: true, index: true },
    sku_variant: { type: String, required: true, unique: true, trim: true, index: true },
    frame_material: { type: String, required: true, trim: true },
    frame_color: { type: String, required: true, trim: true },
    frame_shape: { type: String, required: true, trim: true },
    lens_width: { type: String, required: true, trim: true },
    lens_height: { type: String, required: true, trim: true },
    temple_length: { type: String, required: true, trim: true },
    bridge_width: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    has_uv_protection: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number, default: null, min: 0 },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }))
