"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHistory = void 0;
const mongoose_1 = require("mongoose");
const LoginHistorySchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    platform: { type: String, enum: ["web", "mobile"], required: true },
    device: { type: String, default: null, trim: true },
    ip: { type: String, default: null, trim: true },
    user_agent: { type: String, default: null },
}, { timestamps: true });
// thường hay query theo user + thời gian gần nhất
LoginHistorySchema.index({ user_id: 1, createdAt: -1 });
exports.LoginHistory = (0, mongoose_1.model)("login_histories", LoginHistorySchema);
