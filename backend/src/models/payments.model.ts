
import { Schema, model, Types, Document } from "mongoose"

export type TPaymentProvider = "vnpay" | "cod"
export type TPaymentState = "pending" | "success" | "failed" | "refunded"

export interface IPayment extends Document {
    user_id: Types.ObjectId
    order_id: Types.ObjectId
    provider: TPaymentProvider
    amount: number
    transaction_code?: string | null
    status: TPaymentState
    // phần này là thuộc tính của vnpay
    vnp_txn_ref?: string
    vnp_bank_code?: string
    vnp_bank_tran_no?: string
    vnp_pay_date?: string       // format of date yyyyMMddHHmmss
    vnp_response_code?: string | undefined
    vnp_transaction_no?: string
    vnp_secure_hash?: string
    metadata?: any

    paidAt?: Date | null
    createdAt: Date
    updatedAt: Date
}


export const Payment = model<IPayment>('payments', new Schema<IPayment>({
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    order_id: { type: Schema.Types.ObjectId, ref: "orders", required: true, index: true },
    provider: { type: String, enum: ["vnpay", "momo", "bank_transfer", "cod"], required: true },
    amount: { type: Number, required: true, min: 0 },
    transaction_code: { type: String, default: null },
    status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending", index: true },
    vnp_txn_ref: { type: String, default: null },
    vnp_bank_code: { type: String, default: null },
    vnp_bank_tran_no: { type: String, default: null },
    vnp_pay_date: { type: String, default: null },
    vnp_response_code: { type: String, default: null },
    vnp_transaction_no: { type: String, default: null },
    vnp_secure_hash: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null }
}))