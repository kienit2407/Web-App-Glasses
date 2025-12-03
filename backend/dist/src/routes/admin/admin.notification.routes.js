"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_NOTIFICATION_ROUTES = void 0;
const express_1 = require("express");
const admin_notification_controller_1 = require("../../modules/admin/controllers/admin.notification.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Admin - Notifications
 *     description: Notification nội bộ cho admin (nếu có)
 */
/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Danh sách thông báo admin
 *     tags: [Admin - Notifications]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", admin_notification_controller_1.adminNotificationController.list);
/**
 * @swagger
 * /admin/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu 1 thông báo admin đã đọc
 *     tags: [Admin - Notifications]
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
router.patch("/:id/read", admin_notification_controller_1.adminNotificationController.markRead);
/**
 * @swagger
 * /admin/notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo admin đã đọc
 *     tags: [Admin - Notifications]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch("/read-all", admin_notification_controller_1.adminNotificationController.markAllRead);
/**
 * @swagger
 * /admin/notifications/{id}:
 *   delete:
 *     summary: Xóa 1 thông báo admin
 *     tags: [Admin - Notifications]
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
router.delete("/:id", admin_notification_controller_1.adminNotificationController.remove);
/**
 * @swagger
 * /admin/notifications:
 *   delete:
 *     summary: Xóa tất cả thông báo admin
 *     tags: [Admin - Notifications]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/", admin_notification_controller_1.adminNotificationController.removeAll);
exports.ADMIN_NOTIFICATION_ROUTES = router;
