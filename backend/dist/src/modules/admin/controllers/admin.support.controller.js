"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportAdminController = exports.closeConversation = exports.sendAdminMediaMessage = exports.sendAdminMessage = exports.deleteConversation = exports.listMessages = exports.listConversations = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_support_service_1 = require("../services/admin.support.service");
exports.listConversations = (0, try_catch_1.TryCatch)(async (_req, res) => {
    const data = await admin_support_service_1.supportAdminService.listConversationsForAdmin();
    return res.json({ data });
});
exports.listMessages = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params; // conversation id
    const data = await admin_support_service_1.supportAdminService.listMessagesForAdmin(id);
    return res.json({ data });
});
exports.deleteConversation = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const data = await admin_support_service_1.supportAdminService.deleteConversationForAdmin(id);
    return res.json({ data });
});
exports.sendAdminMessage = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const adminId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params; // conversation id
    const { content } = req.body;
    const data = await admin_support_service_1.supportAdminService.sendAdminMessage(adminId, id, {
        content: content || "",
    });
    return res.status(201).json({ data });
});
exports.sendAdminMediaMessage = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const adminId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const file = (req).file;
    const data = await admin_support_service_1.supportAdminService.sendAdminMediaMessage(adminId, id, file);
    return res.status(201).json({ data });
});
exports.closeConversation = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const adminId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await admin_support_service_1.supportAdminService.closeConversation(adminId, id);
    return res.json({ data });
});
exports.supportAdminController = {
    listConversations: exports.listConversations,
    listMessages: exports.listMessages,
    sendAdminMessage: exports.sendAdminMessage,
    closeConversation: exports.closeConversation,
    deleteConversation: exports.deleteConversation,
    sendAdminMediaMessage: exports.sendAdminMediaMessage
};
