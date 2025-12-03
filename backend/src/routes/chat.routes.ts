import { Router } from "express";
import { chatController } from "../modules/client/controllers/chat.controller";

const router = Router();

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
router.post("/chat", chatController.chat);

export const CHAT_ROUTES = router;
