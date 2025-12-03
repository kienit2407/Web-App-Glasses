import express, { Router } from "express";
import { paymentController } from "../modules/client/controllers/payment.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

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
router.post(
  "/vnpay/create",
  authMidleWares.protectUserRoute,
  paymentController.vnpCreate
);

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
router.post(
  "/cod/confirm",
  authMidleWares.protectUserRoute,
  paymentController.codConfirm
);

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
router.get("/vnpay/return", paymentController.vnpReturn);

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
router.post("/vnpay/ipn", paymentController.vnpIpn);

export const PAYMENT_ROUTES = router;
