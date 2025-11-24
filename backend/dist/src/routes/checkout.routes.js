"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECKOUT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const checkout_controller_1 = require("../modules/client/controllers/checkout.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
// import { authMidleWares } from "../middleware/auth_middleware";
const router = express_1.default.Router();
// bắt buộc đăng nhập
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// preview trước khi tạo order thật
// body: { items: [...], address_id: "...", coupon_code?: "..." }
router.post("/preview", checkout_controller_1.checkoutController.preview);
exports.CHECKOUT_ROUTES = router;
