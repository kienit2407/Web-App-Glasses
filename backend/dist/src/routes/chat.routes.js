"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_ROUTES = void 0;
const express_1 = require("express");
const chat_controller_1 = require("../modules/client/controllers/chat.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Client - Chatbot
 *     description: Chatbot tư vấn kính / đơn hàng
 */
/**
 * @swagger
 * /trap-bot/chat:
 *   post:
 *     summary: Gửi 1 message cho chatbot
 *     tags: [Client - Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       enum: [user, bot]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Thành công, trả về intent + answer
 */
router.post("/chat", chat_controller_1.chatController.chat);
exports.CHAT_ROUTES = router;
