import { Types } from "mongoose";
import { OrderItem } from "../models/orders.item.model";


export async function getOrderThumbnail(orderId: Types.ObjectId | string) {
    const firstItem = await OrderItem.findOne({ order_id: orderId })
        .populate("product_id", "thumbnail_url thumbnail")
        .lean();

    if (!firstItem || !firstItem.product_id) return null;

    const p: any = firstItem.product_id;
    return p.thumbnail_url || p.thumbnail || null;
}
