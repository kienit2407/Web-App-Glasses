"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportUserController = exports.sendMediaMessage = exports.listMyMessages = exports.listMyConversations = exports.sendMessage = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const support_service_1 = require("../services/support.service");
exports.sendMessage = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { content } = req.body;
    const data = await support_service_1.supportUserService.sendUserMessage(userId, {
        content: content || "",
    });
    return res.status(201).json({ data });
});
exports.listMyConversations = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await support_service_1.supportUserService.listMyConversations(userId);
    return res.json({ data });
});
exports.listMyMessages = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params; // conversationId
    const data = await support_service_1.supportUserService.listMessagesForUser(userId, id);
    return res.json({ data });
});
exports.sendMediaMessage = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const file = (req).file;
    const data = await support_service_1.supportUserService.sendUserMediaMessage(userId, file);
    return res.status(201).json({ data });
});
exports.supportUserController = {
    sendMessage: exports.sendMessage,
    sendMediaMessage: exports.sendMediaMessage,
    listMyConversations: exports.listMyConversations,
    listMyMessages: exports.listMyMessages,
};
