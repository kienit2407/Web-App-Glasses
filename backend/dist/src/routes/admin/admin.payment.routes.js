"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PAYMENTS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_payment_controller_1 = require("../../modules/admin/controllers/admin.payment.controller");
const router = express_1.default.Router();
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
router.get("/", admin_payment_controller_1.adminPaymentController.search);
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
router.get("/:id", admin_payment_controller_1.adminPaymentController.detail);
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
router.patch("/:id/status", admin_payment_controller_1.adminPaymentController.updateStatus);
exports.ADMIN_PAYMENTS_ROUTES = router;
