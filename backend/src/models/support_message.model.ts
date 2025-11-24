// src/models/support.message.model.ts
import { Schema, model, Types, Document } from "mongoose";

export type TSupportSenderType = "user" | "admin" | "system";
export type TSupportMessageType = "text" | "image" | "video";

export interface ISupportMessage extends Document {
    conversation_id: Types.ObjectId;
    sender_type: TSupportSenderType;
    sender_id: Types.ObjectId | null;
    type: TSupportMessageType;
    content: string;            // text
    media_url?: string | null;  // ảnh/video Cloudinary
    media_thumb?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
    {
        conversation_id: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
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
    },
    { timestamps: true }
);

export const SupportMessage = model<ISupportMessage>(
    "SupportMessage",
    supportMessageSchema
);
