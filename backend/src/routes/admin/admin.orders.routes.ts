import express, { Router } from "express"
import { adminOrderController } from "../../modules/admin/controllers/admin.order.controller"
import { authMidleWares } from "../../middleware/authMiddleware"

const router: Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin - Orders
 *     description: Quản lý đơn hàng
 */

router.use(authMidleWares.protectUserRoute)

/**
 * @swagger
 * /admin/orders/stats:
 *   get:
 *     summary: Thống kê đơn hàng (admin)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/stats", adminOrderController.stats);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Tìm kiếm / lọc đơn hàng
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", adminOrderController.search)

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng (admin)
 *     tags: [Admin - Orders]
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
router.get("/:id", adminOrderController.detail)

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (pending → processing → shipping → ...)
 *     tags: [Admin - Orders]
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id/status", adminOrderController.updateStatus)

export const ADMIN_ORDERS_ROUTES = router
