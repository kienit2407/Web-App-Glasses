import { Schema, model, Types, Document } from "mongoose"
export type TPromotionDiscountType = "percent" | "fixed";

export interface IPromotion extends Document {
    title: string
    description?: string | null
    banner_url?: string | null
    banner_id?: string | null
    start_date: Date
    end_date: Date
    is_active: boolean
    priority: number // giải quyết chồng khuyến mại
    discount_type: TPromotionDiscountType; // "percent" | "fixed"
    discount_value: number;                // 20 (20%) hoặc 200000 (200k)
    max_discount?: number | null;          // optional, giới hạn trần
    min_order?: number | null;             // optional
    createdAt: Date;
    updatedAt: Date;
}


export const Promotion = model<IPromotion>('promotions', new Schema<IPromotion>({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    banner_url: { type: String, default: null },
    banner_id: { type: String, default: null },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["percent", "fixed"], required: true },
    discount_value: { type: Number, required: true, min: 0 },
    max_discount: { type: Number, default: null, min: 0 },
    min_order: { type: Number, default: null, min: 0 },
}, {timestamps: true}))