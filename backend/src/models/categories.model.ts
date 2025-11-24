import { Schema, model, Types, Document } from "mongoose"

export interface ICategory extends Document {
    _id: Types.ObjectId
    category_name: string
    slug: string
    description?: string | null
    parent_id?: Types.ObjectId | null
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}

export const Category = model<ICategory>('categories', new Schema<ICategory>({
    category_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null },
    parent_id: { type: Schema.Types.ObjectId, ref: "categories", default: null, index: true },
    is_active: { type: Boolean, default: true, index: true }
}, {timestamps : true}))