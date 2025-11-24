// src/models/orders.model.ts
import { Schema, model, Types, Document } from "mongoose"

export type TOrderStatus =
    | "pending"
    | "processing"
    | "shipping"
    | "delivering"
    | "delivered"
    | "cancelled"
    | "returned"

export type TPaymentStatus = "pending" | "success" | "failed" | "refunded"

export interface IAddressSnapshot {
    recipient_name: string
    phone: string
    province_code: string
    district_code: string
    ward_code: string
    specific_address: string
}

export interface IOrder extends Document {
    order_number: string
    user_id: Types.ObjectId
    order_status: TOrderStatus
    payment_status: TPaymentStatus
    subtotal: number
    discount_amount: number
    shipping_fee: number
    total_amount: number
    coupon_code?: string | null
    note?: string | null
    shipping_address: IAddressSnapshot

    // NEW
    cancel_requested: boolean
    return_requested: boolean

    createdAt: Date
    updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
    {
        order_number: { type: String, required: true, unique: true, index: true, trim: true },
        user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
        order_status: {
            type: String,
            enum: ["pending", "processing", "shipping", "delivering", "delivered", "cancelled", "returned"],
            default: "pending",
            index: true,
        },
        payment_status: {
            type: String,
            enum: ["pending", "success", "failed", "refunded"],
            default: "pending",
            index: true,
        },
        subtotal: { type: Number, required: true, min: 0 },
        discount_amount: { type: Number, required: true, min: 0 },
        shipping_fee: { type: Number, required: true, min: 0, default: 0 },
        total_amount: { type: Number, required: true, min: 0 },
        coupon_code: { type: String, default: null },
        note: { type: String, default: null },
        shipping_address: {
            recipient_name: { type: String, required: true, trim: true },
            phone: { type: String, required: true, trim: true },
            province_code: { type: String, required: true, trim: true },
            district_code: { type: String, required: true, trim: true },
            ward_code: { type: String, required: true, trim: true },
            specific_address: { type: String, required: true, trim: true },
        },

        // NEW flags
        cancel_requested: { type: Boolean, default: false, index: true },
        return_requested: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
)

orderSchema.index({ user_id: 1, createdAt: -1 })

export const Order = model<IOrder>("orders", orderSchema)
