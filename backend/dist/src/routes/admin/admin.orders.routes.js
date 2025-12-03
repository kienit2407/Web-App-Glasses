"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_ORDERS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_order_controller_1 = require("../../modules/admin/controllers/admin.order.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin - Orders
 *     description: Quản lý đơn hàng
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.get("/stats", admin_order_controller_1.adminOrderController.stats);
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
router.get("/", admin_order_controller_1.adminOrderController.search);
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
router.get("/:id", admin_order_controller_1.adminOrderController.detail);
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
router.patch("/:id/status", admin_order_controller_1.adminOrderController.updateStatus);
exports.ADMIN_ORDERS_ROUTES = router;
