import express, { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { orderController } from "../modules/client/controllers/order.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Orders
 *     description: Đơn hàng của user
 */

router.use(authMidleWares.protectUserRoute);

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
router.get("/stats", orderController.myStats);

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
router.post("/", orderController.create);

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
router.get("/", orderController.listMy);

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
router.get("/:id", orderController.detailMy);

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
router.patch("/:id/cancel", orderController.cancelMy);

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
router.post("/:id/reorder", orderController.reorderMy);

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
router.patch("/:id/confirm-delivered", orderController.confirmDeliveredMy);

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
router.patch("/:id/request-return", orderController.requestReturnMy);

export const ORDER_ROUTES = router;
