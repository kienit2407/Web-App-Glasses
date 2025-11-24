import { Types } from "mongoose";
import { Cart } from "../../../models/cart.model";
import { CartDetail } from "../../../models/cart.details.model";
import { ProductVariant } from "../../../models/product.variants.model";

interface AddItemPayload {
    variant_id: string;
    quantity?: number;
}

interface UpdateItemPayload {
    quantity: number;
}

export const cartService = {
    async getOrCreateCart(userId: Types.ObjectId) {
        let cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            cart = await Cart.create({ user_id: userId });
        }
        return cart;
    },

    async getMyCart(userId: Types.ObjectId) {
        const cart = await this.getOrCreateCart(userId);

        const items = await CartDetail.find({ cart_id: cart._id })
            .populate({
                path: "variant_id",
                model: "product_variants",
                populate: {
                    path: "product_id",
                    model: "products",
                },
            })
            .lean();

        const mappedItems = items.map((item: any) => {
            const variant = item.variant_id;
            const product = variant?.product_id;

            const original_unit_price = variant?.price ?? 0;
            const unit_price = item.price_at_add; // đã là sale_price hoặc price tại thời điểm add

            const has_discount = unit_price < original_unit_price;

            const original_subtotal = original_unit_price * item.quantity;
            const subtotal = unit_price * item.quantity;
            const discount_amount = Math.max(0, original_subtotal - subtotal);

            const discount_percent = has_discount && original_unit_price > 0
                ? Math.round(
                    ((original_unit_price - unit_price) / original_unit_price) * 100
                )
                : 0;

            return {
                item_id: item._id,
                cart_id: item.cart_id,
                variant_id: variant?._id,
                product_id: product?._id,
                product_name: product?.product_name,
                thumbnail_url: product?.thumbnail_url ?? null,
                frame_color: variant?.frame_color,
                frame_shape: variant?.frame_shape,

                // giá
                original_unit_price,
                unit_price,
                has_discount,
                discount_percent,
                quantity: item.quantity,
                original_subtotal,
                subtotal,
                discount_amount,
            };
        });

        const total_quantity = mappedItems.reduce((sum, i) => sum + i.quantity, 0);
        const total_original_amount = mappedItems.reduce(
            (sum, i) => sum + i.original_subtotal,
            0
        );
        const total_amount = mappedItems.reduce((sum, i) => sum + i.subtotal, 0);
        const total_discount_amount = total_original_amount - total_amount;

        return {
            cart_id: cart._id,
            items: mappedItems,
            total_quantity,
            total_original_amount,
            total_amount,
            total_discount_amount,
        };
    },

    async addItem(userId: Types.ObjectId, payload: AddItemPayload) {
        const { variant_id, quantity = 1 } = payload;

        if (!Types.ObjectId.isValid(variant_id)) {
            throw new Error("Invalid variant_id");
        }

        const variant = await ProductVariant.findOne({
            _id: variant_id,
            is_active: true,
        }).lean();

        if (!variant) {
            throw new Error("Variant not found or inactive");
        }

        if (variant.stock <= 0) {
            throw new Error("Variant is out of stock");
        }

        const cart = await this.getOrCreateCart(userId);

        // GIÁ THỰC TRẢ: sale_price nếu có, nếu không lấy price
        const effectivePrice = variant.sale_price ?? variant.price;
        console.log(">>> addItem cart._id =", cart._id);
        console.log(">>> addItem variant._id =", variant._id);
        const result =  await CartDetail.updateOne(
            { cart_id: cart._id, variant_id: variant._id },
            {
                $setOnInsert: { price_at_add: effectivePrice },
                $inc: { quantity },
            },
            { upsert: true }
        );
        console.log(">>> addItem updateOne result =", result);
        return this.getMyCart(userId);
    },
    // price: giá gốc(niêm yết).
    //     sale_price: giá đã giảm(có thể do promotion khi bạn set ở admin).
    //         price_at_add: giá khách sẽ trả tại thời điểm thêm vào giỏ(để “khóa” giá).
    async updateItem(
        userId: Types.ObjectId,
        itemId: string,
        payload: UpdateItemPayload
    ) {
        if (!Types.ObjectId.isValid(itemId)) {
            throw new Error("Invalid itemId");
        }

        const cart = await this.getOrCreateCart(userId);

        const quantity = payload.quantity;

        const item = await CartDetail.findOne({
            _id: itemId,
            cart_id: cart._id,
        });

        if (!item) {
            throw new Error("Cart item not found");
        }

        if (quantity <= 0) {
            await CartDetail.deleteOne({ _id: item._id });
        } else {
            item.quantity = quantity;
            await item.save();
        }

        return this.getMyCart(userId);
    },

    async removeItem(userId: Types.ObjectId, itemId: string) {
        if (!Types.ObjectId.isValid(itemId)) {
            throw new Error("Invalid itemId");
        }

        const cart = await this.getOrCreateCart(userId);

        await CartDetail.deleteOne({
            _id: itemId,
            cart_id: cart._id,
        });

        return this.getMyCart(userId);
    },
};