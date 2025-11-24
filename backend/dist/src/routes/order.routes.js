"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const order_controller_1 = require("../modules/client/controllers/order.controller");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.post("/", /*validate(createOrder),*/ /*order.create*/ order_controller_1.orderController.create); // snapshot address, items, coupon
router.get("/", /*order.listMy*/ order_controller_1.orderController.listMy); // ?status&page&limit
router.get("/:id", /*order.detailMy*/ order_controller_1.orderController.detailMy);
router.patch("/:id/cancel", /*order.cancelMy*/ order_controller_1.orderController.cancelMy);
router.post("/:id/reorder", order_controller_1.orderController.reorderMy);
// NEW:
router.patch("/:id/confirm-delivered", order_controller_1.orderController.confirmDeliveredMy);
router.patch("/:id/request-return", order_controller_1.orderController.requestReturnMy);
exports.ORDER_ROUTES = router;
