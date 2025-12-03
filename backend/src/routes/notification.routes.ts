import { Router } from "express";
import { userNotificationController } from "../modules/client/controllers/notification.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Notifications
 *     description: Thông báo cho user
 */

router.use(authMidleWares.protectUserRoute);

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
router.get("/", userNotificationController.list);

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
router.patch("/:id/read", userNotificationController.markRead);

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
router.patch("/read-all", userNotificationController.markAllRead);

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
router.delete("/:id", userNotificationController.remove);

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
router.delete("/", userNotificationController.removeAll);

export const NOTIFICATION_ROUTES = router;
