import express, { Router } from "express";
import { adminPaymentController } from "../../modules/admin/controllers/admin.payment.controller";


const router: Router = express.Router();

// // tất cả route dưới đây chỉ admin được dùng
// router.use(
//     authMidleWares.protectUserRoute,
//     authMidleWares.protectAdminRoute
// );

// GET /admin/payments?status=&provider=&user_id=&order_id=&code=&from_date=&to_date=&page=&limit=
router.get("/", adminPaymentController.search);

// GET /admin/payments/:id
router.get("/:id", adminPaymentController.detail);

// PATCH /admin/payments/:id/status   { status: "success" | "failed" | "refunded" }
router.patch("/:id/status", adminPaymentController.updateStatus);

export const ADMIN_PAYMENTS_ROUTES = router;
