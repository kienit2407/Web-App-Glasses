"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = void 0;
const app_errol_1 = require("../../../utils/app_errol");
const try_catch_1 = require("../../../utils/try_catch");
const chat_service_1 = require("../services/chat.service");
exports.chatController = {
    chat: (0, try_catch_1.TryCatch)(async (req, res) => {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            throw new app_errol_1.BadRequestException("Message is required");
        }
        const result = await (0, chat_service_1.chatWithCustomer)(message.trim(), Array.isArray(history) ? history : []);
        return res.json({ data: result });
    }),
};
