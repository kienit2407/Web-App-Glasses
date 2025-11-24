"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutService = void 0;
const order_service_1 = require("./order.service");
exports.checkoutService = {
    async preview(userId, payload) {
        const result = await order_service_1.orderService.calculatePricingFromCartSelection(userId, {
            cart_item_ids: payload.cart_item_ids,
            address_id: payload.address_id,
            coupon_code: payload.coupon_code,
        });
        const { cartItemObjectIds, ...rest } = result;
        return rest;
    },
};
