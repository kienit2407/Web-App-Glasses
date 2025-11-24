import express, { Router } from "express"
import { paymentController } from "../modules/client/controllers/payment.controller"
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router()

router.post(
    "/vnpay/create",
    authMidleWares.protectUserRoute,
    paymentController.vnpCreate
);

router.post(
    "/cod/confirm",
    authMidleWares.protectUserRoute,
    paymentController.codConfirm
);

// Callback từ VNPay: KHÔNG dùng auth, vì VNPay đâu có gửi JWT cho mình được
router.get("/vnpay/return", paymentController.vnpReturn);
router.post("/vnpay/ipn", paymentController.vnpIpn);

export const PAYMENT_ROUTES = router
