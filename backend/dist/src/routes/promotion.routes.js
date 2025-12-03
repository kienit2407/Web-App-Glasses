"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMOTION_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const promotion_controller_1 = require("../modules/client/controllers/promotion.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Promotions
 *     description: Chương trình khuyến mãi (popup, center)
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
/**
 * @swagger
 * /promotions/center:
 *   get:
 *     summary: Danh sách chương trình khuyến mãi trong "Coupon Center"
 *     tags: [Client - Promotions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/center", promotion_controller_1.promotionController.listCenter);
/**
 * @swagger
 * /promotions/highlight:
 *   get:
 *     summary: Lấy promotion nổi bật để show popup
 *     tags: [Client - Promotions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/highlight", promotion_controller_1.promotionController.getHighlight);
/**
 * @swagger
 * /promotions/{id}/seen:
 *   post:
 *     summary: Đánh dấu user đã xem popup promotion
 *     tags: [Client - Promotions]
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
router.post("/:id/seen", promotion_controller_1.promotionController.markHighlightSeen);
exports.PROMOTION_ROUTES = router;
