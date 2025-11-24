"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PAYMENTS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_payment_controller_1 = require("../../modules/admin/controllers/admin.payment.controller");
const router = express_1.default.Router();
// // tất cả route dưới đây chỉ admin được dùng
// router.use(
//     authMidleWares.protectUserRoute,
//     authMidleWares.protectAdminRoute
// );
// GET /admin/payments?status=&provider=&user_id=&order_id=&code=&from_date=&to_date=&page=&limit=
router.get("/", admin_payment_controller_1.adminPaymentController.search);
// GET /admin/payments/:id
router.get("/:id", admin_payment_controller_1.adminPaymentController.detail);
// PATCH /admin/payments/:id/status   { status: "success" | "failed" | "refunded" }
router.patch("/:id/status", admin_payment_controller_1.adminPaymentController.updateStatus);
exports.ADMIN_PAYMENTS_ROUTES = router;
