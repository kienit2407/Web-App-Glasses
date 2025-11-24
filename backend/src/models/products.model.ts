import { Schema, model, Types, Document } from "mongoose"

export interface IProduct extends Document {
    product_name: string
    slug: string
    selled_amount: number
    review_count: number
    rating_avg?: number
    description: string
    tags: string[]
    for_gender: "male" | "female" | "unisex" | "kids"
    thumbnail_url?: string | null
    thumbnail_id: string | null
    origin_country?: string | null
    category_id: Types.ObjectId
    brand_id: Types.ObjectId
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}

export const Product = model<IProduct>("products", new Schema<IProduct>({
    product_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    selled_amount: { type: Number, default: 0, min: 0 },
    review_count: { type: Number, default: 0, min: 0 },
    rating_avg: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    for_gender: {
        type: String,
        required: true,
        enum: ["male", "female", "unisex", "kids"],
        index: true,
    },

    thumbnail_url: { type: String, required: true, default: null },
    thumbnail_id: { type: String, required: true, default: null },
    origin_country: { type: String, default: null },
    category_id: { type: Schema.Types.ObjectId, ref: "categories", required: true, index: true },
    brand_id: { type: Schema.Types.ObjectId, ref: "brands", required: true, index: true },
    is_active: { type: Boolean, default: false, index: true }
}, { timestamps: true }).index({
    is_active: 1, // thuận lợi cho listing (chỉ lất nhưng sản phẩm là true còn hoạt động)
    category_id: 1, //đánh index 
    createdAt: -1
}))
