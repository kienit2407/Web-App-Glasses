"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
// GET /api/wishlist
const getWishlist = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).populate("wishlist.product");
        res.json(user?.wishlist || []);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getWishlist = getWishlist;
// POST /api/wishlist/add
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product_1.default.findById(productId);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const exists = user.wishlist.find((w) => w.product.toString() === productId);
        if (!exists) {
            user.wishlist.push({ product: product._id, addedAt: new Date() });
            await user.save();
        }
        res.json(user.wishlist);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.addToWishlist = addToWishlist;
// DELETE /api/wishlist/remove/:productId
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        user.wishlist = user.wishlist.filter((w) => w.product.toString() !== productId);
        await user.save();
        res.json(user.wishlist);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.removeFromWishlist = removeFromWishlist;
