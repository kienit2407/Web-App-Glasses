import { Schema, model, Types, Document } from "mongoose"
export type TCouponType = "percent" | "fixed"

export interface ICoupon extends Document {
    _id: Types.ObjectId
    code: string
    type: TCouponType // kiểm giảm giá 1. là giảm 100 hay là % tự tính
    value: number
    max_discount?: number | null
    min_order?: number | null
    usage_limit?: number | null
    per_user_limit?: number | null
    start_date: Date
    usage_turn : number | null
    end_date?: Date | null
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}


export const Coupon = model<ICoupon>('coupons', new Schema<ICoupon>({
    code: { type: String, required: true, unique: true, trim: true, uppercase: true // không phân biệt hoa thường

    },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    max_discount: { type: Number, default: null, min: 0 },
    min_order: { type: Number, default: null, min: 0 },
    usage_limit: { type: Number, default: null, min: 0 },
    usage_turn: { type: Number, default: null, min: 0 },
    per_user_limit: { type: Number, default: null, min: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, default: null },
    is_active: { type: Boolean, default: true, index: true }
}, {timestamps: true}))