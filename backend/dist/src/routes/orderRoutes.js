"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
router.options('/', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).json({ message: 'OK' });
});
router.options('/:id', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).json({ message: 'OK' });
});
router.post("/", authMiddleware_1.protect, orderController_1.createOrder);
router.get("/myorders", authMiddleware_1.protect, orderController_1.getMyOrders);
router.get("/:id", authMiddleware_1.protect, orderController_1.getOrderById);
router.get("/", authMiddleware_1.protect, authMiddleware_1.adminOnly, orderController_1.getAllOrders);
router.put("/:id/status", authMiddleware_1.protect, authMiddleware_1.adminOnly, orderController_1.updateOrderStatus);
exports.default = router;
