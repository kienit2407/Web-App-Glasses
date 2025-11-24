// src/modules/client/services/support.user.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { BadRequestException } from "../../../utils/app_errol";
import { SEND_EVENT_TO_ADMINS } from "../../../config/socket.io";
import { SupportConversation } from "../../../models/support_conversation.model";
import { SupportMessage } from "../../../models/support_message.model";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";

interface SendMessagePayload {
    content?: string;
    type?: "text" | "image" | "video";
    media_url?: string | null;
    media_thumb?: string | null;
}

async function findOrCreateConversationForUser(userId: Types.ObjectId) {
    let conv = await SupportConversation.findOne({
        user_id: userId,
        status: { $ne: "closed" },
    });

    if (!conv) {
        conv = await SupportConversation.create({
            user_id: userId,
            status: "open",
            last_message_at: new Date(),
            last_message_preview: "",
            last_message_type: "text",
            unread_for_admin: 0,
            unread_for_user: 0,
        });
    }

    return conv;
}

export const supportUserService = {
    // USER gửi tin nhắn cho shop
    async sendUserMessage(userId: Types.ObjectId, payload: SendMessagePayload) {
        const { content = "", type = "text", media_url, media_thumb } = payload;

        if (!content.trim() && !media_url) {
            throw new BadRequestException("Content or media is required");
        }

        const conv = await findOrCreateConversationForUser(userId);
        let finalContent = content.trim();
        if (!finalContent && media_url) {
            finalContent = type === "image" ? "[Hình ảnh]" : "[Video]";
        }
        const msg = await SupportMessage.create({
            conversation_id: conv._id,
            sender_type: "user",
            sender_id: userId,
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
        conv.unread_for_admin += 1;
        await conv.save();


        SEND_EVENT_TO_ADMINS("admin:chat:new_message", {
            conversation_id: conv._id,
            message: msg.toObject(),
            user_id: userId,
            preview: preview.slice(0, 100),
            createdAt: msg.createdAt,
        });

        return { conversation: conv.toObject(), message: msg.toObject() };
    },

    // USER: list các cuộc hội thoại của mình
    async listMyConversations(userId: Types.ObjectId) {
        const convs = await SupportConversation.find({ user_id: userId })
            .sort({ last_message_at: -1 })
            .lean();

        return convs;
    },

    // USER: list messages của 1 cuộc hội thoại
    async listMessagesForUser(userId: Types.ObjectId, conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException("Invalid conversation id");
        }

        const conv = await SupportConversation.findOne({
            _id: conversationId,
            user_id: userId,
        });

        // ✅ Không tự tạo mới nữa, nếu không thấy thì báo lỗi
        if (!conv) {
            throw new BadRequestException("Conversation not found");
            // hoặc custom NotFoundException tuỳ bạn có class hay không
        }

        const messages = await SupportMessage.find({
            conversation_id: conv._id,
        })
            .sort({ createdAt: 1 })
            .lean();

        // user đã vào xem → clear unread_for_user
        conv.unread_for_user = 0;
        await conv.save();

        return { conversation: conv.toObject(), messages };
    },
    async sendUserMediaMessage(userId: Types.ObjectId, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException("File is required");
        }

        const mime = file.mimetype;
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");

        if (!isImage && !isVideo) {
            throw new BadRequestException("Only image or video is allowed");
        }

        // TODO: nếu muốn tách upload video riêng thì làm helper khác
        const { secure_url } = await uploadImageBuffer(
            file.buffer,
            isImage ? "support/images" : "support/videos"
        );

        // Tái sử dụng logic sendUserMessage để tránh duplicate
        return this.sendUserMessage(userId, {
            type: isImage ? "image" : "video",
            media_url: secure_url,
            media_thumb: null,
            content: "",
        });
    },
};
