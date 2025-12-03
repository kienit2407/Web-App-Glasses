"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORT_ROUTES = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const support_controller_1 = require("../modules/client/controllers/support.controller");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Client - Support
 *     description: Hỗ trợ khách hàng (inbox, chat với admin)
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
/**
 * @swagger
 * /support/messages/media:
 *   post:
 *     summary: Gửi file media trong hội thoại support
 *     tags: [Client - Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               conversation_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/messages/media", upload_middlewares_1.uploadMiddlewares.upload.single("file"), support_controller_1.supportUserController.sendMediaMessage);
/**
 * @swagger
 * /support/messages:
 *   post:
 *     summary: Gửi tin nhắn text support (tạo mới hoặc tiếp tục cuộc cũ)
 *     tags: [Client - Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversation_id:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/messages", support_controller_1.supportUserController.sendMessage);
/**
 * @swagger
 * /support/conversations:
 *   get:
 *     summary: Danh sách hội thoại support của user
 *     tags: [Client - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/conversations", support_controller_1.supportUserController.listMyConversations);
/**
 * @swagger
 * /support/conversations/{id}/messages:
 *   get:
 *     summary: Danh sách message trong 1 hội thoại
 *     tags: [Client - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/conversations/:id/messages", support_controller_1.supportUserController.listMyMessages);
exports.SUPPORT_ROUTES = router;
