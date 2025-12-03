"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const order_controller_1 = require("../modules/client/controllers/order.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Orders
 *     description: Đơn hàng của user
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Thống kê đơn hàng của user (tổng, đã giao, đang giao...)
 *     tags: [Client - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/stats", order_controller_1.orderController.myStats);
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới từ cart/selection
 *     tags: [Client - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Snapshot address, items, coupon_code...
 *     responses:
 *       201:
 *         description: Tạo đơn thành công
 */
router.post("/", order_controller_1.orderController.create);
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Danh sách đơn hàng của user
 *     tags: [Client - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái đơn
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", order_controller_1.orderController.listMy);
/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng
 *     tags: [Client - Orders]
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
router.get("/:id", order_controller_1.orderController.detailMy);
/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng (nếu còn cho phép)
 *     tags: [Client - Orders]
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
 *         description: Hủy đơn thành công
 */
router.patch("/:id/cancel", order_controller_1.orderController.cancelMy);
/**
 * @swagger
 * /orders/{id}/reorder:
 *   post:
 *     summary: Đặt lại đơn hàng cũ
 *     tags: [Client - Orders]
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
router.post("/:id/reorder", order_controller_1.orderController.reorderMy);
/**
 * @swagger
 * /orders/{id}/confirm-delivered:
 *   patch:
 *     summary: Xác nhận đã nhận hàng
 *     tags: [Client - Orders]
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
router.patch("/:id/confirm-delivered", order_controller_1.orderController.confirmDeliveredMy);
/**
 * @swagger
 * /orders/{id}/request-return:
 *   patch:
 *     summary: Yêu cầu trả hàng / hoàn tiền
 *     tags: [Client - Orders]
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
router.patch("/:id/request-return", order_controller_1.orderController.requestReturnMy);
exports.ORDER_ROUTES = router;
