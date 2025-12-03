"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutService = void 0;
const order_service_1 = require("./order.service");
const app_errol_1 = require("../../../utils/app_errol");
exports.checkoutService = {
    async preview(userId, payload) {
        const { cart_item_ids, items, address_id, coupon_code } = payload;
        // Ưu tiên: nếu có cart_item_ids => checkout từ giỏ
        if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
            const result = await order_service_1.orderService.calculatePricingFromCartSelection(userId, {
                cart_item_ids,
                address_id,
                coupon_code,
            });
            // BE cart-version trả thêm cartItemObjectIds chỉ phục vụ cho createOrder,
            // preview FE không cần -> loại bỏ cho sạch payload về client.
            const { cartItemObjectIds, ...rest } = result;
            return rest;
        }
        // Nếu không có cart_item_ids mà có items => checkout trực tiếp (mua ngay)
        if (items && Array.isArray(items) && items.length > 0) {
            const result = await order_service_1.orderService.calculatePricingFromDirectSelection(userId, {
                items,
                address_id,
                coupon_code,
            });
            // direct-version không đụng gì đến cart nên trả thẳng
            return result;
        }
        // Nếu cả 2 đều không có => lỗi
        throw new app_errol_1.BadRequestException("Either cart_item_ids or items must be provided");
    },
};
