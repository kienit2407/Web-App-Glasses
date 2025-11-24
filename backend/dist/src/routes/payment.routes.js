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
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.post("/vnpay/create", /*/*requireAuth,*/ /*pay.vnpCreate*/ payment_controller_1.paymentController.vnpCreate); // {order_id, returnUrl}
router.get("/vnpay/return", /*pay.vnpReturn*/ payment_controller_1.paymentController.vnpReturn); // redirect from vnp
router.post("/vnpay/ipn", /*pay.vnpIpn*/ payment_controller_1.paymentController.vnpIpn); // server-to-server
// COD (nếu cần)
router.post("/cod/confirm", /*/*requireAuth,*/ /*pay.codConfirm*/ payment_controller_1.paymentController.codConfirm);
exports.PAYMENT_ROUTES = router;
