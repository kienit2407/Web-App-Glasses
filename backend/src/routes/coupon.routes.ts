import express, { Router } from "express";
import { couponController } from "../modules/client/controllers/coupon.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Coupons
 *     description: Coupon dành cho user
 */

router.use(authMidleWares.protectUserRoute);

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Danh sách coupon có thể claim / sử dụng
 *     tags: [Client - Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", couponController.listAvailable);

/**
 * @swagger
 * /coupons/{code}/check:
 *   get:
 *     summary: Kiểm tra thông tin 1 coupon theo code
 *     tags: [Client - Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã coupon
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/:code/check", couponController.check);

/**
 * @swagger
 * /coupons/claim/{code}:
 *   post:
 *     summary: User claim 1 coupon vào ví của mình
 *     tags: [Client - Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claim thành công
 */
router.post("/claim/:code", couponController.claim);

export const COUPON_ROUTES = router;
