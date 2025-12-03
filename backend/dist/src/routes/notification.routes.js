"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_ROUTES = void 0;
const express_1 = require("express");
const notification_controller_1 = require("../modules/client/controllers/notification.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Client - Notifications
 *     description: Thông báo cho user
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Danh sách thông báo của user
 *     tags: [Client - Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", notification_controller_1.userNotificationController.list);
/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     tags: [Client - Notifications]
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
router.patch("/:id/read", notification_controller_1.userNotificationController.markRead);
/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Client - Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch("/read-all", notification_controller_1.userNotificationController.markAllRead);
/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Xóa 1 thông báo
 *     tags: [Client - Notifications]
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
router.delete("/:id", notification_controller_1.userNotificationController.remove);
/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Xóa tất cả thông báo
 *     tags: [Client - Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/", notification_controller_1.userNotificationController.removeAll);
exports.NOTIFICATION_ROUTES = router;
