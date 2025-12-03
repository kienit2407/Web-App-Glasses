import { Router } from "express";
import { authMidleWares } from "../../middleware/authMiddleware";
import { supportAdminController } from "../../modules/admin/controllers/admin.support.controller";
import { uploadMiddlewares } from "../../middleware/upload.middlewares";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Support
 *     description: Admin xử lý hội thoại hỗ trợ khách hàng
 */

router.use(authMidleWares.protectUserRoute);

/**
 * @swagger
 * /admin/support/conversations:
 *   get:
 *     summary: Danh sách hội thoại support (admin xem tất cả)
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/conversations", supportAdminController.listConversations);

/**
 * @swagger
 * /admin/support/conversations/{id}/messages:
 *   get:
 *     summary: Danh sách tin nhắn trong 1 cuộc support
 *     tags: [Admin - Support]
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
router.get("/conversations/:id/messages", supportAdminController.listMessages);

/**
 * @swagger
 * /admin/support/conversations/{id}/media:
 *   post:
 *     summary: Admin gửi file media trong hội thoại
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post(
  "/conversations/:id/media",
  uploadMiddlewares.upload.single("file"),
  supportAdminController.sendAdminMediaMessage
);

/**
 * @swagger
 * /admin/support/conversations/{id}/messages:
 *   post:
 *     summary: Admin gửi message text
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/conversations/:id/messages", supportAdminController.sendAdminMessage);

/**
 * @swagger
 * /admin/support/conversations/{id}/close:
 *   patch:
 *     summary: Đóng cuộc hội thoại
 *     tags: [Admin - Support]
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
 *         description: Đóng thành công
 */
router.patch("/conversations/:id/close", supportAdminController.closeConversation);

/**
 * @swagger
 * /admin/support/conversations/{id}:
 *   delete:
 *     summary: Xóa hẳn 1 hội thoại
 *     tags: [Admin - Support]
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
 *         description: Xóa thành công
 */
router.delete("/conversations/:id", supportAdminController.deleteConversation);

export const ADMIN_SUPPORT_ROUTES = router;
