"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const AddressSchema = new mongoose_1.Schema({
    recipient_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    province_code: { type: String, required: true, trim: true },
    district_code: { type: String, required: true, trim: true },
    ward_code: { type: String, required: true, trim: true },
    specific_address: { type: String, required: true, trim: true },
    is_default: { type: Boolean, default: false }
}, { _id: true }); // cần id để chỉnh sửa
const AuthProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true, trim: true },
    provider_id: { type: String, required: true, trim: true }
}, { _id: false }); // k cần
const LastLoginSchema = new mongoose_1.Schema({
    device: { type: String, default: null, trim: true },
    ip: { type: String, default: null },
    atTime: { type: Date, default: null }
}, { _id: false }); // k cần bảng trung gian
exports.User = (0, mongoose_1.model)("users", new mongoose_1.Schema({
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
        default: null, // cho phép null vì có thể qua social
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
}, { timestamps: true }));
