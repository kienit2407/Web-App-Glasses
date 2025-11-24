import { Schema, model, Types, Document } from "mongoose"

export interface IBrand extends Document {
    brand_name: string
    description?: string | null
    slug: string
    logo_url: string | null 
    logo_id: string | null 
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}

export const Brand = model<IBrand>('brands', new Schema<IBrand>({
    brand_name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null },
    slug: { type: String, required: true, unique: true, trim: true },
    logo_url: { type: String, default: null },
    logo_id: { type: String, default: null },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }))