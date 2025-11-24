import { Schema, model, Document, Types } from "mongoose"

export interface IAddress {
    _id?: Types.ObjectId
    recipient_name: string
    phone: string
    province_code: string
    district_code: string
    ward_code: string
    specific_address: string
    is_default: boolean
}

const AddressSchema = new Schema<IAddress>({
    recipient_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    province_code: { type: String, required: true, trim: true },
    district_code: { type: String, required: true, trim: true },
    ward_code: { type: String, required: true, trim: true },
    specific_address: { type: String, required: true, trim: true },
    is_default: { type: Boolean, default: false }
}, { _id: true }) // cần id để chỉnh sửa

// Schemaa phương thuwc đnăg nhập
export interface IAuthProvider {
    provider: 'password' | 'google'
    provider_id?: string
}
const AuthProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true, trim: true },
    provider_id: { type: String, required: true, trim: true }
}, { _id: false }) // k cần


export interface ILastLogin {
    device?: string | null
    ip?: string | null
    atTime?: Date | null
}

const LastLoginSchema = new Schema<ILastLogin>({
    device: { type: String, default: null, trim: true },
    ip: { type: String, default: null },
    atTime: { type: Date, default: null }
}, { _id: false }) // k cần bảng trung gian


export interface IUser extends Document {
    _id: Types.ObjectId
    email: string
    display_name: string
    password: string | null
    auth_provider?: Array<IAuthProvider>
    avatar_url?: string | null
    avatar_id?: string | null
    delivering_addresses: Types.DocumentArray<IAddress>
    roles: Array<"user" | "admin">
    is_active: boolean
    is_show: boolean
    last_login?: ILastLogin | null
    createdAt: Date
    updatedAt: Date
}


export const User = model<IUser>("users", new Schema<IUser>({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    display_name: {
        type: String,
        required: true,
        trim: true,
        index: true // để tìm kiếm nhanh trong admin
    },
    password: {
        type: String,
        default: null,  // cho phép null vì có thể qua social
        minlength: 8,
        select: false // không trả về khi find bằng id
    },
    auth_provider: {
        type: [AuthProviderSchema],
        default: null
    },
    avatar_url: { type: String, default: null, trim: true },
    avatar_id: { type: String, default: null, trim: true },
    delivering_addresses: {
        type: [AddressSchema],
        default: []
    },

    roles: {
        type: [String],
        enum: ["user", "admin"],
        default: ["user"]
    },

    is_active: { type: Boolean, default: true },
    is_show: { type: Boolean, default: false },

    last_login: { type: LastLoginSchema, default: null }
}, { timestamps: true }))
