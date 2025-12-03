"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderThumbnail = getOrderThumbnail;
const orders_item_model_1 = require("../models/orders.item.model");
async function getOrderThumbnail(orderId) {
    const firstItem = await orders_item_model_1.OrderItem.findOne({ order_id: orderId })
        .populate("product_id", "thumbnail_url thumbnail")
        .lean();
    if (!firstItem || !firstItem.product_id)
        return null;
    const p = firstItem.product_id;
    return p.thumbnail_url || p.thumbnail || null;
}
