"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getOrderById = exports.getMyOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Payment_1 = __importDefault(require("../models/Payment")); // Thêm import
const Shipping_1 = __importDefault(require("../models/Shipping")); // Thêm import
// POST /api/orders - create order
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, billingAddress, paymentMethod, paymentDetails, total, email, phone, shippingMethod = 'Standard' } = req.body; // Thêm shippingMethod default
        const user = req.user?._id; // Từ auth middleware
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' }); // Thêm check
        }
        // Check stock và update (di chuyển vào try để rollback nếu cần, nhưng đơn giản hóa)
        for (const item of items) {
            const product = await Product_1.default.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }
            product.stock -= item.quantity;
            await product.save();
        }
        // Tạo Order
        const order = await Order_1.default.create({
            user,
            items,
            shippingAddress,
            billingAddress,
            paymentMethod,
            paymentDetails,
            total,
            email,
            phone,
        });
        // Tạo Payment
        const payment = await Payment_1.default.create({
            order: order._id,
            method: paymentMethod,
            amount: total,
            currency: 'USD',
        });
        // Tạo Shipping
        const shipping = await Shipping_1.default.create({
            order: order._id,
            fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            address: `${shippingAddress.address}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''}`,
            city: shippingAddress.city,
            postalCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone,
            shippingMethod,
        });
        // Update Order với refs
        order.payment = payment._id;
        order.shipping = shipping._id;
        await order.save();
        res.status(201).json(order);
    }
    catch (err) {
        console.error(err); // Log để debug
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
exports.createOrder = createOrder;
// GET /api/orders/myorders - get logged in user's orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({ user: req.user._id });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getMyOrders = getMyOrders;
// GET /api/orders/:id - get order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate("user", "firstName lastName email")
            .populate("items.product", "name price"); // <-- thêm populate cho sản phẩm
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        res.json(order);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getOrderById = getOrderById;
// GET /api/orders - get all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({})
            .populate("user", "firstName lastName email")
            .populate("items.product", "name price"); // <-- thêm populate cho sản phẩm
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllOrders = getAllOrders;
// PUT /api/orders/:id/status - update order status (admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        order.status = status.toLowerCase(); // Type assertion
        await order.save();
        res.json({ message: "Order status updated", order });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
