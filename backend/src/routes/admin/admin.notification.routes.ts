import { Router } from "express"
import { adminNotificationController } from "../../modules/admin/controllers/admin.notification.controller"

const router = Router()

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
router.get("/", adminNotificationController.list);

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
router.patch("/:id/read", adminNotificationController.markRead);

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
router.patch("/read-all", adminNotificationController.markAllRead);

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
router.delete("/:id", adminNotificationController.remove);

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
router.delete("/", adminNotificationController.removeAll);

export const ADMIN_NOTIFICATION_ROUTES = router
