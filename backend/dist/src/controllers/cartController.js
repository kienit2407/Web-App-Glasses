"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCart = exports.addToCart = exports.getCart = void 0;
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
// GET /api/cart
const getCart = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).populate("cart.product");
        res.json(user?.cart || []);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getCart = getCart;
// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product_1.default.findById(productId);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const existing = user.cart.find((item) => item.product.toString() === productId);
        if (existing) {
            existing.quantity += quantity;
        }
        else {
            user.cart.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity,
                image: product.image,
            });
        }
        await user.save();
        res.json(user.cart);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.addToCart = addToCart;
// DELETE /api/cart/remove/:productId
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        user.cart = user.cart.filter((item) => item.product.toString() !== productId);
        await user.save();
        res.json(user.cart);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.removeFromCart = removeFromCart;
