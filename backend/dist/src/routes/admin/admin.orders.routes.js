"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_ORDERS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_order_controller_1 = require("../../modules/admin/controllers/admin.order.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/stats", admin_order_controller_1.adminOrderController.stats);
router.get("/", /*adminOrder.search*/ admin_order_controller_1.adminOrderController.search); // filter: status, date, user, code
router.get("/:id", /*adminOrder.detail*/ admin_order_controller_1.adminOrderController.detail);
router.patch("/:id/status", /*adminOrder.updateStatus*/ admin_order_controller_1.adminOrderController.updateStatus); // pending→processing→shipping→...
exports.ADMIN_ORDERS_ROUTES = router;
