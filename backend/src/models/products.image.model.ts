import { Schema, model, Types, Document } from "mongoose"

export interface IProductImage extends Document {
    product_id: Types.ObjectId
    variant_id?: Types.ObjectId | null
    url: string | null
    url_id: string | null
    position: number
    createdAt: Date
    updatedAt: Date
}


export const ProductImage = model<IProductImage>("product_images", new Schema<IProductImage>({
    product_id: { type: Schema.Types.ObjectId, ref: "products", required: true },
    variant_id: { type: Schema.Types.ObjectId, ref: "product_variants", default: null },
    url: { type: String, default: null },
    url_id: { type: String, default: null },
    position: { type: Number, default: 0 }
}, { timestamps: true })
    .index({ product_id: 1 })
    .index({
        variant_id: 1,
        position: 1 //để một product có nhiều ảnh (0,1,2,…) nhưng mỗi position chỉ có một ảnh.
    }, { unique: true })) 
