"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutController = exports.preview = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const checkout_service_1 = require("../services/checkout.service");
exports.preview = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const { cart_item_ids, items, address_id, coupon_code } = req.body;
    if (!address_id) {
        throw new app_errol_1.BadRequestException("address_id is required");
    }
    const hasCartItems = Array.isArray(cart_item_ids) && cart_item_ids.length > 0;
    const hasDirectItems = Array.isArray(items) && items.length > 0;
    if (!hasCartItems && !hasDirectItems) {
        // Không truyền gì cả
        throw new app_errol_1.BadRequestException("cart_item_ids or items is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await checkout_service_1.checkoutService.preview(userId, {
        cart_item_ids: hasCartItems ? cart_item_ids : undefined,
        items: hasDirectItems ? items : undefined,
        address_id,
        coupon_code: coupon_code ?? null,
    });
    return res.json({ data });
});
exports.checkoutController = {
    preview: exports.preview,
};
