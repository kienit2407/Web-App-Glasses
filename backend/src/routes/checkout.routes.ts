import express, { Router } from "express";
import { checkoutController } from "../modules/client/controllers/checkout.controller";
import { authMidleWares } from "../middleware/authMiddleware";
// import { authMidleWares } from "../middleware/auth_middleware";

const router: Router = express.Router();

// bắt buộc đăng nhập
router.use(authMidleWares.protectUserRoute);

// preview trước khi tạo order thật
// body: { items: [...], address_id: "...", coupon_code?: "..." }
router.post("/preview", checkoutController.preview);

export const CHECKOUT_ROUTES = router;