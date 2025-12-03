"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportMessage = void 0;
// src/models/support.message.model.ts
const mongoose_1 = require("mongoose");
const supportMessageSchema = new mongoose_1.Schema({
    conversation_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SupportConversation",
        required: true,
        index: true,
    },
    sender_type: {
        type: String,
        enum: ["user", "admin", "system"],
        required: true,
    },
    sender_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        default: null,
    },
    type: {
        type: String,
        enum: ["text", "image", "video"],
        default: "text",
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    media_url: { type: String, default: null },
    media_thumb: { type: String, default: null },
}, { timestamps: true });
exports.SupportMessage = (0, mongoose_1.model)("SupportMessage", supportMessageSchema);
