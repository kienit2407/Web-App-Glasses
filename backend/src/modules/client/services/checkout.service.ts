// src/modules/client/services/checkout.service.ts
import { Types } from "mongoose";
import { orderService } from "./order.service";
import { BadRequestException } from "../../../utils/app_errol";

interface DirectItemInput {
  variant_id: string;
  quantity: number;
}

interface CheckoutPreviewPayload {
  // 1 trong 2: cart_item_ids (checkout từ giỏ)
  // hoặc items (mua ngay)
  cart_item_ids?: string[];
  items?: DirectItemInput[];
  address_id: string;
  coupon_code?: string | null;
}

export const checkoutService = {
  async preview(userId: Types.ObjectId, payload: CheckoutPreviewPayload) {
    const { cart_item_ids, items, address_id, coupon_code } = payload;

    // Ưu tiên: nếu có cart_item_ids => checkout từ giỏ
    if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
      const result = await orderService.calculatePricingFromCartSelection(userId, {
        cart_item_ids,
        address_id,
        coupon_code,
      });

      // BE cart-version trả thêm cartItemObjectIds chỉ phục vụ cho createOrder,
      // preview FE không cần -> loại bỏ cho sạch payload về client.
      const { cartItemObjectIds, ...rest } = result as any;
      return rest;
    }

    // Nếu không có cart_item_ids mà có items => checkout trực tiếp (mua ngay)
    if (items && Array.isArray(items) && items.length > 0) {
      const result = await orderService.calculatePricingFromDirectSelection(userId, {
        items,
        address_id,
        coupon_code,
      });

      // direct-version không đụng gì đến cart nên trả thẳng
      return result;
    }

    // Nếu cả 2 đều không có => lỗi
    throw new BadRequestException("Either cart_item_ids or items must be provided");
  },
};
