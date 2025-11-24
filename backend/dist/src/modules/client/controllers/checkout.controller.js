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
    const { cart_item_ids, address_id, coupon_code } = req.body;
    if (!cart_item_ids || !Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
        throw new app_errol_1.BadRequestException("cart_item_ids is required");
    }
    if (!address_id) {
        throw new app_errol_1.BadRequestException("address_id is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await checkout_service_1.checkoutService.preview(userId, {
        cart_item_ids,
        address_id,
        coupon_code,
    });
    return res.json({ data });
});
exports.checkoutController = {
    preview: exports.preview,
};
