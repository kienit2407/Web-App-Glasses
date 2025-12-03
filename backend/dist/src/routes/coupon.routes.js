"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUPON_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const coupon_controller_1 = require("../modules/client/controllers/coupon.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Coupons
 *     description: Coupon dành cho user
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.get("/", coupon_controller_1.couponController.listAvailable);
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
router.get("/:code/check", coupon_controller_1.couponController.check);
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
router.post("/claim/:code", coupon_controller_1.couponController.claim);
exports.COUPON_ROUTES = router;
