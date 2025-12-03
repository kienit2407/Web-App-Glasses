"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportUserService = void 0;
// src/modules/client/services/support.user.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const app_errol_1 = require("../../../utils/app_errol");
const socket_io_1 = require("../../../config/socket.io");
const support_conversation_model_1 = require("../../../models/support_conversation.model");
const support_message_model_1 = require("../../../models/support_message.model");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
async function findOrCreateConversationForUser(userId) {
    let conv = await support_conversation_model_1.SupportConversation.findOne({
        user_id: userId,
        status: { $ne: "closed" },
    });
    if (!conv) {
        conv = await support_conversation_model_1.SupportConversation.create({
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
exports.supportUserService = {
    // USER: list các cuộc hội thoại của mình
    async listMyConversations(userId) {
        const convs = await support_conversation_model_1.SupportConversation.find({ user_id: userId })
            .sort({ last_message_at: -1 })
            .lean();
        return convs;
    },
    // USER: list messages của 1 cuộc hội thoại
    async listMessagesForUser(userId, conversationId) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        const conv = await support_conversation_model_1.SupportConversation.findOne({
            _id: conversationId,
            user_id: userId,
        });
        if (!conv) {
            throw new app_errol_1.BadRequestException("Conversation not found");
            // hoặc custom NotFoundException tuỳ bạn có class hay không
        }
        const messages = await support_message_model_1.SupportMessage.find({
            conversation_id: conv._id,
        })
            .sort({ createdAt: 1 })
            .lean();
        // user đã vào xem → clear unread_for_user
        conv.unread_for_user = 0;
        await conv.save();
        return { conversation: conv.toObject(), messages };
    },
    // USER gửi tin nhắn cho shop
    async sendUserMessage(userId, payload) {
        const { content = "", type = "text", media_url, media_thumb } = payload;
        if (!content.trim() && !media_url) {
            throw new app_errol_1.BadRequestException("Content or media is required");
        }
        const conv = await findOrCreateConversationForUser(userId);
        let finalContent = content.trim();
        if (!finalContent && media_url) {
            finalContent = type === "image" ? "[Hình ảnh]" : "[Video]";
        }
        const msg = await support_message_model_1.SupportMessage.create({
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
        (0, socket_io_1.SEND_EVENT_TO_ADMINS)("admin:chat:new_message", {
            conversation_id: conv._id,
            message: msg.toObject(),
            user_id: userId,
            preview: preview.slice(0, 100),
            createdAt: msg.createdAt,
        });
        return { conversation: conv.toObject(), message: msg.toObject() };
    },
    async sendUserMediaMessage(userId, file) {
        if (!file) {
            throw new app_errol_1.BadRequestException("File is required");
        }
        const mime = file.mimetype;
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");
        if (!isImage && !isVideo) {
            throw new app_errol_1.BadRequestException("Only image or video is allowed");
        }
        // TODO: nếu muốn tách upload video riêng thì làm helper khác
        const { secure_url } = await (0, cloudinary_helper_1.uploadImageBuffer)(file.buffer, isImage ? "support/images" : "support/videos");
        // Tái sử dụng logic sendUserMessage để tránh duplicate
        return this.sendUserMessage(userId, {
            type: isImage ? "image" : "video",
            media_url: secure_url,
            media_thumb: null,
            content: "",
        });
    },
};
