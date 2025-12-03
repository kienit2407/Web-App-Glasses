"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../modules/client/controllers/payment.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/vnpay/create", authMiddleware_1.authMidleWares.protectUserRoute, payment_controller_1.paymentController.vnpCreate);
router.post("/cod/confirm", authMiddleware_1.authMidleWares.protectUserRoute, payment_controller_1.paymentController.codConfirm);
// Callback từ VNPay: KHÔNG dùng auth, vì VNPay đâu có gửi JWT cho mình được
router.get("/vnpay/return", payment_controller_1.paymentController.vnpReturn);
router.post("/vnpay/ipn", payment_controller_1.paymentController.vnpIpn);
exports.PAYMENT_ROUTES = router;
