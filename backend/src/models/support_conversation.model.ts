// src/models/support.conversation.model.ts
import { Schema, model, Types, Document } from "mongoose";

export type TConversationStatus = "open" | "pending" | "closed";
export type TLastMessageType = "text" | "image" | "video";

export interface ISupportConversation extends Document {
    user_id: Types.ObjectId;
    assigned_admin_id?: Types.ObjectId | null;
    status: TConversationStatus;
    last_message_at: Date;
    last_message_preview: string;
    last_message_type: TLastMessageType;
    unread_for_admin: number;
    unread_for_user: number;
    createdAt: Date;
    updatedAt: Date;
}

const supportConversationSchema = new Schema<ISupportConversation>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
        assigned_admin_id: { type: Schema.Types.ObjectId, ref: "users", default: null },
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
    },
    { timestamps: true }
);

export const SupportConversation = model<ISupportConversation>(
    "SupportConversation",
    supportConversationSchema
);
