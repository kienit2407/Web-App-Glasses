"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
exports.Payment = (0, mongoose_1.model)('payments', new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true },
    order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "orders", required: true, index: true },
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
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null }
}));
