// src/routes/promotion.routes.ts
import express, { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { promotionController } from "../modules/client/controllers/promotion.controller";

const router: Router = express.Router();


router.use(authMidleWares.protectUserRoute)
// GET /promotions/center  → list các chương trình khuyến mãi cho coupon center
router.get("/center", promotionController.listCenter);

// GET /promotions/highlight → lấy promo để show popup
router.get("/highlight", promotionController.getHighlight);
router.use(authMidleWares.protectUserRoute);
// POST /promotions/:id/seen → đánh dấu user đã xem popup
router.post("/:id/seen", promotionController.markHighlightSeen);

export const PROMOTION_ROUTES = router;
