// src/modules/admin/services/support.admin.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from "../../../utils/app_errol";
import { SEND_EVENT_TO_USER } from "../../../config/socket.io";
import { SupportConversation } from "../../../models/support_conversation.model";
import { SupportMessage } from "../../../models/support_message.model";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";

interface SendMessagePayload {
    content?: string;
    type?: "text" | "image" | "video";
    media_url?: string | null;
    media_thumb?: string | null;
}

export const supportAdminService = {
    // ADMIN: list all conversations
    async listConversationsForAdmin() {
        const convs = await SupportConversation.find({})
            .populate("user_id", "display_name email avatar_url")
            .sort({ last_message_at: -1 })
            .lean();

        return convs;
    },

    // ADMIN: list messages trong 1 conversation
    async listMessagesForAdmin(conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        const conv = await SupportConversation.findById(conversationId).populate(
            "user_id",
            "display_name email"
        );

        if (!conv) throw new NotFoundException("Conversation not found");

        const messages = await SupportMessage.find({
            conversation_id: conv._id,
        })
            .sort({ createdAt: 1 })
            .lean();

        // admin đọc → clear unread_for_admin
        conv.unread_for_admin = 0;
        await conv.save();

        return { conversation: conv.toObject(), messages };
    },

    // ADMIN gửi tin nhắn cho user
    async sendAdminMessage(
        adminId: Types.ObjectId,
        conversationId: string,
        payload: SendMessagePayload
    ) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        const { content = "", type = "text", media_url, media_thumb } = payload;
        if (!content.trim() && !media_url) {
            throw new BadRequestException("Content or media is required");
        }

        const conv = await SupportConversation.findById(conversationId);
        if (!conv) throw new NotFoundException("Conversation not found");

        if (conv.status === "closed") {
            throw new ForbiddenException("Conversation is closed");
        }
        let finalContent = content.trim();
        if (!finalContent && media_url) {
            finalContent = type === "image" ? "[Hình ảnh]" : "[Video]";
        }
        const msg = await SupportMessage.create({
            conversation_id: conv._id,
            sender_type: "admin",
            sender_id: adminId,
            type,
            content: finalContent,
            media_url: media_url || null,
            media_thumb: media_thumb || null,
        });

        let preview = content.trim();
        if (!preview) {
            preview = type === "image" ? "[Hình ảnh]" : "[Video]";
        }

        conv.last_message_at = msg.createdAt;
        conv.last_message_preview = preview.slice(0, 120);
        conv.last_message_type = type;
        conv.unread_for_user += 1;
        if (!conv.assigned_admin_id) {
            conv.assigned_admin_id = adminId;
        }
        await conv.save();

        // 🔔 gửi socket cho USER – widget nhận chat:new_message
        SEND_EVENT_TO_USER(String(conv.user_id), "chat:new_message", {
            conversation_id: conv._id,
            message: msg.toObject(),
            preview: preview.slice(0, 100),
            createdAt: msg.createdAt,
        });

        return { conversation: conv.toObject(), message: msg.toObject() };
    },

    async closeConversation(adminId: Types.ObjectId, conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        const conv = await SupportConversation.findById(conversationId);
        if (!conv) throw new NotFoundException("Conversation not found");

        conv.status = "closed";
        await conv.save();

        return conv.toObject();
    },

    async deleteConversationForAdmin(conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        await SupportMessage.deleteMany({ conversation_id: conversationId });
        await SupportConversation.deleteOne({ _id: conversationId });

        return { success: true };
    },
    async sendAdminMediaMessage(
        adminId: Types.ObjectId,
        conversationId: string,
        file: Express.Multer.File
    ) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        if (!file) {
            throw new BadRequestException("File is required");
        }

        const mime = file.mimetype;
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");

        if (!isImage && !isVideo) {
            throw new BadRequestException("Only image or video is allowed");
        }

        const { secure_url } = await uploadImageBuffer(
            file.buffer,
            isImage ? "support/images" : "support/videos"
        );

        // tái sử dụng logic sendAdminMessage
        return this.sendAdminMessage(adminId, conversationId, {
            type: isImage ? "image" : "video",
            media_url: secure_url,
            media_thumb: null,
            content: "",
        });
    },
};
