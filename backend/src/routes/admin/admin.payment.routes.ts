import express, { Router } from "express"
import { adminPaymentController } from "../../modules/admin/controllers/admin.payment.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Payments
 *     description: Quản lý giao dịch thanh toán (VNPay / COD)
 */

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: Tìm kiếm giao dịch thanh toán
 *     tags: [Admin - Payments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: order_id
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
router.get("/", adminPaymentController.search);

/**
 * @swagger
 * /admin/payments/{id}:
 *   get:
 *     summary: Chi tiết 1 giao dịch thanh toán
 *     tags: [Admin - Payments]
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
router.get("/:id", adminPaymentController.detail);

/**
 * @swagger
 * /admin/payments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái giao dịch (success/failed/refunded)
 *     tags: [Admin - Payments]
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
 *                 enum: [success, failed, refunded]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id/status", adminPaymentController.updateStatus);

export const ADMIN_PAYMENTS_ROUTES = router;
