import { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { supportUserController } from "../modules/client/controllers/support.controller";
import { uploadMiddlewares } from "../middleware/upload.middlewares";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Support
 *     description: Hỗ trợ khách hàng (inbox, chat với admin)
 */

router.use(authMidleWares.protectUserRoute);

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
router.post(
  "/messages/media",
  uploadMiddlewares.upload.single("file"),
  supportUserController.sendMediaMessage
);

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
router.post("/messages", supportUserController.sendMessage);

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
router.get("/conversations", supportUserController.listMyConversations);

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
router.get("/conversations/:id/messages", supportUserController.listMyMessages);

export const SUPPORT_ROUTES = router;
