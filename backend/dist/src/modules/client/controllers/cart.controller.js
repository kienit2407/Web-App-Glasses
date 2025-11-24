"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.removeItem = exports.updateItem = exports.addItem = exports.getMyCart = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const cart_service_1 = require("../services/cart.service");
// GET /cart
exports.getMyCart = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = req.user._id;
    const cart = await cart_service_1.cartService.getMyCart(userId);
    return res.json({ data: cart });
});
exports.addItem = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { variant_id, quantity } = req.body;
    if (!variant_id) {
        throw new app_errol_1.BadRequestException("Chưa có sản phẩm nào được chọn");
    }
    const userId = req.user._id;
    try {
        const cart = await cart_service_1.cartService.addItem(userId, {
            variant_id,
            quantity,
        });
        return res.status(201).json({ data: cart });
    }
    catch (err) {
        throw new app_errol_1.BadRequestException(err.message || "Cannot add item to cart");
    }
});
exports.updateItem = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined) {
        throw new app_errol_1.BadRequestException("quantity is required");
    }
    const userId = req.user._id;
    try {
        const cart = await cart_service_1.cartService.updateItem(userId, itemId, { quantity });
        return res.json({ data: cart });
    }
    catch (err) {
        if (err.message === "Cart item not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot update cart item");
    }
});
// DELETE /cart/items/:itemId
exports.removeItem = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { itemId } = req.params;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const cart = await cart_service_1.cartService.removeItem(userId, itemId);
    return res.json({ data: cart });
});
exports.cartController = {
    getMyCart: exports.getMyCart,
    addItem: exports.addItem,
    updateItem: exports.updateItem,
    removeItem: exports.removeItem,
};
