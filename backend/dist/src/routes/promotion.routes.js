"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMOTION_ROUTES = void 0;
// src/routes/promotion.routes.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const promotion_controller_1 = require("../modules/client/controllers/promotion.controller");
const router = express_1.default.Router();
// tất cả route promo client đều cần đăng nhập
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// GET /promotions/center  → list các chương trình khuyến mãi cho coupon center
router.get("/center", promotion_controller_1.promotionController.listCenter);
// GET /promotions/highlight → lấy promo để show popup
router.get("/highlight", promotion_controller_1.promotionController.getHighlight);
// POST /promotions/:id/seen → đánh dấu user đã xem popup
router.post("/:id/seen", promotion_controller_1.promotionController.markHighlightSeen);
exports.PROMOTION_ROUTES = router;
