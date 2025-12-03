import express, { Router } from "express";
import { checkoutController } from "../modules/client/controllers/checkout.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Checkout
 *     description: Tính toán tạm tính order trước khi tạo thật
 */

router.use(authMidleWares.protectUserRoute);

/**
 * @swagger
 * /checkout/preview:
 *   post:
 *     summary: Preview đơn hàng (tính tổng tiền + phí ship + áp mã giảm)
 *     tags: [Client - Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               address_id:
 *                 type: string
 *               coupon_code:
 *                 type: string
 *             required:
 *               - items
 *               - address_id
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/preview", checkoutController.preview);

export const CHECKOUT_ROUTES = router;
