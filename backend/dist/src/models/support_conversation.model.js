"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportConversation = void 0;
// src/models/support.conversation.model.ts
const mongoose_1 = require("mongoose");
const supportConversationSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    assigned_admin_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", default: null },
    status: {
        type: String,
        enum: ["open", "pending", "closed"],
        default: "open",
        index: true,
    },
    last_message_at: { type: Date, default: Date.now },
    last_message_preview: { type: String, default: "" },
    last_message_type: {
        type: String,
        enum: ["text", "image", "video"],
        default: "text",
    },
    unread_for_admin: { type: Number, default: 0 },
    unread_for_user: { type: Number, default: 0 },
}, { timestamps: true });
exports.SupportConversation = (0, mongoose_1.model)("SupportConversation", supportConversationSchema);
