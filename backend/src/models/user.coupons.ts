import { Schema, model, Types, Document } from "mongoose"

export interface IUserCoupon extends Document {
    user_id: Types.ObjectId
    coupon_id: Types.ObjectId
    saved_at: Date
    used_order_id?: Types.ObjectId | null
    is_used: boolean
    is_saved: boolean
}


export const UserCoupon = model<IUserCoupon>('user_coupons', new Schema<IUserCoupon>({
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    coupon_id: { type: Schema.Types.ObjectId, ref: "coupons", required: true, index: true },
    saved_at: { type: Date, default: () => new Date() },
    is_saved: { type: Boolean, default: false },
    used_order_id: { type: Schema.Types.ObjectId, ref: "orders", default: null },
    is_used: { type: Boolean, default: false }
}).index(
    {
        user_id: 1,
        coupon_id: 1 // mỗi user chỉ được lưu 1 lần vouchers
    },
    { unique: true }
))