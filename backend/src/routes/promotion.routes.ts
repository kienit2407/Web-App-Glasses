import express, { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { promotionController } from "../modules/client/controllers/promotion.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Promotions
 *     description: Chương trình khuyến mãi (popup, center)
 */

router.use(authMidleWares.protectUserRoute);

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
router.get("/center", promotionController.listCenter);

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
router.get("/highlight", promotionController.getHighlight);

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
router.post("/:id/seen", promotionController.markHighlightSeen);

export const PROMOTION_ROUTES = router;
