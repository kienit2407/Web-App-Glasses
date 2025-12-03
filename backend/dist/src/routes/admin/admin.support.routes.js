"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_SUPPORT_ROUTES = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const admin_support_controller_1 = require("../../modules/admin/controllers/admin.support.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Admin - Support
 *     description: Admin xử lý hội thoại hỗ trợ khách hàng
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.get("/conversations", admin_support_controller_1.supportAdminController.listConversations);
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
router.get("/conversations/:id/messages", admin_support_controller_1.supportAdminController.listMessages);
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
router.post("/conversations/:id/media", upload_middlewares_1.uploadMiddlewares.upload.single("file"), admin_support_controller_1.supportAdminController.sendAdminMediaMessage);
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
router.post("/conversations/:id/messages", admin_support_controller_1.supportAdminController.sendAdminMessage);
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
router.patch("/conversations/:id/close", admin_support_controller_1.supportAdminController.closeConversation);
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
router.delete("/conversations/:id", admin_support_controller_1.supportAdminController.deleteConversation);
exports.ADMIN_SUPPORT_ROUTES = router;
