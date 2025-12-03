"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportAdminService = void 0;
// src/modules/admin/services/support.admin.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const app_errol_1 = require("../../../utils/app_errol");
const socket_io_1 = require("../../../config/socket.io");
const support_conversation_model_1 = require("../../../models/support_conversation.model");
const support_message_model_1 = require("../../../models/support_message.model");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
exports.supportAdminService = {
    // ADMIN: list all conversations
    async listConversationsForAdmin() {
        const convs = await support_conversation_model_1.SupportConversation.find({})
            .populate("user_id", "display_name email avatar_url")
            .sort({ last_message_at: -1 })
            .lean();
        return convs;
    },
    // ADMIN: list messages trong 1 conversation
    async listMessagesForAdmin(conversationId) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        const conv = await support_conversation_model_1.SupportConversation.findById(conversationId).populate("user_id", "display_name email");
        if (!conv)
            throw new app_errol_1.NotFoundException("Conversation not found");
        const messages = await support_message_model_1.SupportMessage.find({
            conversation_id: conv._id,
        })
            .sort({ createdAt: 1 })
            .lean();
        // admin đọc → clear unread_for_admin
        conv.unread_for_admin = 0;
        await conv.save();
        return { conversation: conv.toObject(), messages };
    },
    async closeConversation(adminId, conversationId) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        const conv = await support_conversation_model_1.SupportConversation.findById(conversationId);
        if (!conv)
            throw new app_errol_1.NotFoundException("Conversation not found");
        conv.status = "closed";
        await conv.save();
        return conv.toObject();
    },
    async deleteConversationForAdmin(conversationId) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        await support_message_model_1.SupportMessage.deleteMany({ conversation_id: conversationId });
        await support_conversation_model_1.SupportConversation.deleteOne({ _id: conversationId });
        return { success: true };
    },
    // ADMIN gửi tin nhắn cho user
    async sendAdminMessage(adminId, conversationId, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        const { content = "", type = "text", media_url, media_thumb } = payload;
        if (!content.trim() && !media_url) {
            throw new app_errol_1.BadRequestException("Content or media is required");
        }
        const conv = await support_conversation_model_1.SupportConversation.findById(conversationId);
        if (!conv)
            throw new app_errol_1.NotFoundException("Conversation not found");
        if (conv.status === "closed") {
            throw new app_errol_1.ForbiddenException("Conversation is closed");
        }
        let finalContent = content.trim();
        if (!finalContent && media_url) {
            finalContent = type === "image" ? "[Hình ảnh]" : "[Video]";
        }
        const msg = await support_message_model_1.SupportMessage.create({
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
        (0, socket_io_1.SEND_EVENT_TO_USER)(String(conv.user_id), "chat:new_message", {
            conversation_id: conv._id,
            message: msg.toObject(),
            preview: preview.slice(0, 100),
            createdAt: msg.createdAt,
        });
        return { conversation: conv.toObject(), message: msg.toObject() };
    },
    async sendAdminMediaMessage(adminId, conversationId, file) {
        if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
            throw new app_errol_1.BadRequestException("Invalid conversation id");
        }
        if (!file) {
            throw new app_errol_1.BadRequestException("File is required");
        }
        const mime = file.mimetype;
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");
        if (!isImage && !isVideo) {
            throw new app_errol_1.BadRequestException("Only image or video is allowed");
        }
        const { secure_url } = await (0, cloudinary_helper_1.uploadImageBuffer)(file.buffer, isImage ? "support/images" : "support/videos");
        // tái sử dụng logic sendAdminMessage
        return this.sendAdminMessage(adminId, conversationId, {
            type: isImage ? "image" : "video",
            media_url: secure_url,
            media_thumb: null,
            content: "",
        });
    },
};
