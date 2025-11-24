import { Schema, model, Document, Types } from "mongoose"

export interface ILoginHistory extends Document {
    user_id: Types.ObjectId
    platform: "web" | "mobile"
    device: string | null           // tên thiết bị / platform + UA
    ip: string | null               // địa chỉ IP
    user_agent: string | null       // full user agent
    createdAt: Date
    updatedAt: Date
}

const LoginHistorySchema = new Schema<ILoginHistory>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
        platform: { type: String, enum: ["web", "mobile"], required: true },
        device: { type: String, default: null, trim: true },
        ip: { type: String, default: null, trim: true },
        user_agent: { type: String, default: null },
    },
    { timestamps: true }
)

// thường hay query theo user + thời gian gần nhất
LoginHistorySchema.index({ user_id: 1, createdAt: -1 })

export const LoginHistory = model<ILoginHistory>("login_histories", LoginHistorySchema)
