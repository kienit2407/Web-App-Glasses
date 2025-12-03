"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECKOUT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const checkout_controller_1 = require("../modules/client/controllers/checkout.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Checkout
 *     description: Tính toán tạm tính order trước khi tạo thật
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.post("/preview", checkout_controller_1.checkoutController.preview);
exports.CHECKOUT_ROUTES = router;
