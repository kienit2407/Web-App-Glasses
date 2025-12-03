"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../modules/client/controllers/payment.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Payments
 *     description: Thanh toán VNPay / COD
 */
/**
 * @swagger
 * /payments/vnpay/create:
 *   post:
 *     summary: Tạo URL thanh toán VNPay cho đơn hàng
 *     tags: [Client - Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *               return_url:
 *                 type: string
 *             required:
 *               - order_id
 *     responses:
 *       200:
 *         description: Thành công, trả về URL VNPay
 */
router.post("/vnpay/create", authMiddleware_1.authMidleWares.protectUserRoute, payment_controller_1.paymentController.vnpCreate);
/**
 * @swagger
 * /payments/cod/confirm:
 *   post:
 *     summary: Xác nhận thanh toán COD cho đơn hàng
 *     tags: [Client - Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/cod/confirm", authMiddleware_1.authMidleWares.protectUserRoute, payment_controller_1.paymentController.codConfirm);
/**
 * @swagger
 * /payments/vnpay/return:
 *   get:
 *     summary: VNPay redirect về sau khi thanh toán (client redirect)
 *     tags: [Client - Payments]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/vnpay/return", payment_controller_1.paymentController.vnpReturn);
/**
 * @swagger
 * /payments/vnpay/ipn:
 *   post:
 *     summary: IPN từ VNPay (server to server)
 *     tags: [Client - Payments]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/vnpay/ipn", payment_controller_1.paymentController.vnpIpn);
exports.PAYMENT_ROUTES = router;
