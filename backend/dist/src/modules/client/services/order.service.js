"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
// src/modules/client/services/order.service.ts
const mongoose_1 = require("mongoose");
const orders_model_1 = require("../../../models/orders.model");
const orders_item_model_1 = require("../../../models/orders.item.model");
const cart_model_1 = require("../../../models/cart.model");
const cart_details_model_1 = require("../../../models/cart.details.model");
const product_variants_model_1 = require("../../../models/product.variants.model");
const products_model_1 = require("../../../models/products.model");
const coupons_model_1 = require("../../../models/coupons.model");
const user_coupons_1 = require("../../../models/user.coupons");
const promotion_model_1 = require("../../../models/promotion.model");
const promotion_brand_model_1 = require("../../../models/promotion.brand.model");
const promotion_product_model_1 = require("../../../models/promotion.product.model");
const generate_order_code_1 = require("../../../utils/generate_order_code");
const address_service_1 = require("./address.service");
const shipping_serivce_1 = require("./shipping.serivce");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
const environment_1 = require("../../../config/environment");
const socket_io_1 = require("../../../config/socket.io");
// ====== HELPER: TÍNH PROMOTION TỐT NHẤT ======
async function calculateBestPromotionDiscount(orderItemsData, products) {
    const now = new Date();
    const promotions = await promotion_model_1.Promotion.find({
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now },
    }).lean();
    if (!promotions.length) {
        return { discount: 0, promotion: null };
    }
    const promoIds = promotions.map((p) => p._id);
    const [brandLinks, productLinks] = await Promise.all([
        promotion_brand_model_1.PromotionBrand.find({ promotion_id: { $in: promoIds } }).lean(),
        promotion_product_model_1.PromotionProduct.find({ promotion_id: { $in: promoIds } }).lean(),
    ]);
    const brandsByPromo = new Map();
    const productsByPromo = new Map();
    for (const bl of brandLinks) {
        const key = String(bl.promotion_id);
        if (!brandsByPromo.has(key))
            brandsByPromo.set(key, new Set());
        brandsByPromo.get(key).add(String(bl.brand_id));
    }
    for (const pl of productLinks) {
        const key = String(pl.promotion_id);
        if (!productsByPromo.has(key))
            productsByPromo.set(key, new Set());
        productsByPromo.get(key).add(String(pl.product_id));
    }
    const productMap = new Map();
    products.forEach((p) => productMap.set(String(p._id), p));
    let bestDiscount = 0;
    let bestPromotion = null;
    for (const promo of promotions) {
        const pId = String(promo._id);
        const brandSet = brandsByPromo.get(pId) ?? new Set();
        const productSet = productsByPromo.get(pId) ?? new Set();
        let eligibleSubtotal = 0;
        for (const item of orderItemsData) {
            const product = productMap.get(String(item.product_id));
            if (!product)
                continue;
            const productId = String(product._id);
            const brandId = product.brand_id ? String(product.brand_id) : null;
            const matchByProduct = productSet.has(productId);
            const matchByBrand = brandId ? brandSet.has(brandId) : false;
            if (!matchByProduct && !matchByBrand)
                continue;
            eligibleSubtotal += item.total;
        }
        if (eligibleSubtotal <= 0)
            continue;
        if (promo.min_order != null && eligibleSubtotal < promo.min_order) {
            continue;
        }
        let discount = 0;
        if (promo.discount_type === "percent") {
            discount = (eligibleSubtotal * promo.discount_value) / 100;
            if (promo.max_discount != null) {
                discount = Math.min(discount, promo.max_discount);
            }
        }
        else {
            discount = promo.discount_value;
        }
        if (discount > eligibleSubtotal) {
            discount = eligibleSubtotal;
        }
        if (discount > bestDiscount ||
            (discount === bestDiscount &&
                bestPromotion &&
                (promo.priority ?? 0) > (bestPromotion.priority ?? 0)) ||
            (discount === bestDiscount &&
                bestPromotion &&
                (promo.priority ?? 0) === (bestPromotion.priority ?? 0) &&
                promo.start_date > bestPromotion.start_date)) {
            bestDiscount = discount;
            bestPromotion = promo;
        }
    }
    if (!bestPromotion || bestDiscount <= 0) {
        return { discount: 0, promotion: null };
    }
    const applied = {
        _id: bestPromotion._id,
        title: bestPromotion.title,
        discount_type: bestPromotion.discount_type,
        discount_value: bestPromotion.discount_value,
        max_discount: bestPromotion.max_discount,
        min_order: bestPromotion.min_order,
    };
    return { discount: bestDiscount, promotion: applied };
}
// ====== 1) HÀM CHUNG: TÍNH GIÁ TỪ CART ======
async function calculatePricingFromCartSelection(userId, payload, opts = {}) {
    const { session } = opts;
    const { cart_item_ids, address_id, coupon_code } = payload;
    if (!cart_item_ids || cart_item_ids.length === 0) {
        throw new app_errol_1.BadRequestException("No cart items selected");
    }
    const cart = await cart_model_1.Cart.findOne({ user_id: userId })
        .session(session || null)
        .lean();
    if (!cart) {
        throw new app_errol_1.NotFoundException("Cart not found");
    }
    const cartItemObjectIds = cart_item_ids
        .filter((id) => mongoose_1.Types.ObjectId.isValid(id))
        .map((id) => new mongoose_1.Types.ObjectId(id));
    const cartItems = await cart_details_model_1.CartDetail.find({
        _id: { $in: cartItemObjectIds },
        cart_id: cart._id,
    })
        .session(session || null)
        .lean();
    if (cartItems.length === 0) {
        throw new app_errol_1.BadRequestException("Selected cart items not found");
    }
    // Address snapshot
    const addressDoc = await address_service_1.addressService.getMyAddressById(userId, address_id);
    if (!addressDoc) {
        throw new app_errol_1.BadRequestException("Address not found");
    }
    const shipping_address = {
        recipient_name: addressDoc.recipient_name,
        phone: addressDoc.phone,
        province_code: addressDoc.province_code,
        district_code: addressDoc.district_code,
        ward_code: addressDoc.ward_code,
        specific_address: addressDoc.specific_address,
    };
    // Variants + products
    const variantIds = cartItems.map((ci) => ci.variant_id);
    const variants = await product_variants_model_1.ProductVariant.find({
        _id: { $in: variantIds },
        is_active: true,
    })
        .session(session || null)
        .lean();
    if (variants.length === 0) {
        throw new app_errol_1.BadRequestException("Variants not found or inactive");
    }
    const variantMap = new Map();
    variants.forEach((v) => variantMap.set(String(v._id), v));
    const productIds = variants.map((v) => v.product_id);
    const products = await products_model_1.Product.find({
        _id: { $in: productIds },
    })
        .session(session || null)
        .lean();
    const productMap = new Map();
    products.forEach((p) => productMap.set(String(p._id), p));
    // Build order items + subtotal
    let subtotal = 0;
    const orderItemsData = [];
    for (const ci of cartItems) {
        const variant = variantMap.get(String(ci.variant_id));
        if (!variant) {
            throw new app_errol_1.default("Variant not found or inactive", 400);
        }
        const product = productMap.get(String(variant.product_id));
        if (!product) {
            throw new app_errol_1.default("Product not found", 400);
        }
        const unit_price = ci.price_at_add ?? variant.price;
        const quantity = ci.quantity;
        const total = unit_price * quantity;
        if (variant.stock < quantity) {
            throw new app_errol_1.BadRequestException(`Variant ${variant.sku_variant || variant._id} is out of stock`);
        }
        subtotal += total;
        orderItemsData.push({
            product_id: product._id,
            variant_id: variant._id,
            sku: variant.sku_variant ?? null,
            name: product.product_name,
            attributes: {
                frame_material: variant.frame_material,
                frame_color: variant.frame_color,
                frame_shape: variant.frame_shape,
                lens_width: variant.lens_width,
                lens_height: variant.lens_height,
                temple_length: variant.temple_length,
                bridge_width: variant.bridge_width,
                has_uv_protection: variant.has_uv_protection,
            },
            unit_price,
            quantity,
            total,
        });
    }
    // ----------------- GIẢM GIÁ TỪ COUPON -----------------
    let couponDiscount = 0;
    let applied_coupon = null;
    if (coupon_code) {
        const normalizedCode = coupon_code.trim().toUpperCase();
        const coupon = await coupons_model_1.Coupon.findOne({
            code: normalizedCode,
            is_active: true,
        })
            .session(session || null)
            .lean();
        if (!coupon) {
            throw new app_errol_1.BadRequestException("Coupon not found or inactive");
        }
        const now = new Date();
        if (coupon.start_date && now < coupon.start_date) {
            throw new app_errol_1.BadRequestException("Coupon not started yet");
        }
        if (coupon.end_date && now > coupon.end_date) {
            throw new app_errol_1.BadRequestException("Coupon has expired");
        }
        if (coupon.min_order && subtotal < coupon.min_order) {
            throw new app_errol_1.BadRequestException(`Order subtotal must be >= ${coupon.min_order} to use this coupon`);
        }
        if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
            const usedByUser = await user_coupons_1.UserCoupon.countDocuments({
                user_id: userId,
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null);
            if (usedByUser >= coupon.per_user_limit) {
                throw new app_errol_1.BadRequestException("You have reached coupon usage limit");
            }
        }
        if (coupon.usage_limit != null && coupon.usage_limit > 0) {
            const usedTotal = await user_coupons_1.UserCoupon.countDocuments({
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null);
            if (usedTotal >= coupon.usage_limit) {
                throw new app_errol_1.BadRequestException("Coupon usage limit has been reached");
            }
        }
        if (coupon.type === "percent") {
            couponDiscount = (subtotal * coupon.value) / 100;
            if (coupon.max_discount != null) {
                couponDiscount = Math.min(couponDiscount, coupon.max_discount);
            }
        }
        else {
            couponDiscount = coupon.value;
        }
        if (couponDiscount > subtotal) {
            couponDiscount = subtotal;
        }
        applied_coupon = {
            _id: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount,
            min_order: coupon.min_order,
        };
    }
    // ----------------- GIẢM GIÁ TỪ PROMOTION TỰ ĐỘNG -----------------
    const { discount: promotionDiscount, promotion: applied_promotionObj, } = await calculateBestPromotionDiscount(orderItemsData, products);
    // ----------------- CHỌN NGUỒN GIẢM GIÁ TỐT NHẤT -----------------
    let discount_amount = 0;
    let discount_source = "none";
    let applied_promotion = null;
    if (couponDiscount <= 0 && promotionDiscount <= 0) {
        discount_amount = 0;
        discount_source = "none";
        applied_promotion = null;
        applied_coupon = null;
    }
    else if (couponDiscount >= promotionDiscount) {
        discount_amount = couponDiscount;
        discount_source = couponDiscount > 0 ? "coupon" : "none";
        applied_promotion = null;
        // giữ applied_coupon
    }
    else {
        discount_amount = promotionDiscount;
        discount_source = "promotion";
        applied_promotion = applied_promotionObj;
        // nếu chọn promotion thì bỏ coupon (mã user nhập nhưng không được áp)
        applied_coupon = null;
    }
    // Shipping fee (GHN) – tính trên số tiền đã trừ discount
    const totalQuantity = orderItemsData.reduce((sum, li) => sum + li.quantity, 0);
    const weightPerItem = Number(environment_1.env.REALISTIC_GRAM);
    const totalWeight = totalQuantity * weightPerItem;
    const shippingQuote = await shipping_serivce_1.shippingService.quote({
        district_code: shipping_address.district_code,
        ward_code: shipping_address.ward_code,
        total_weight: totalWeight,
        order_amount: subtotal - discount_amount,
    });
    const shipping_fee = shippingQuote.shipping_fee ?? 0;
    const total_amount = subtotal - discount_amount + shipping_fee;
    return {
        shipping_address,
        orderItemsData,
        cartItemObjectIds,
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        applied_coupon,
        applied_promotion,
        discount_source,
    };
}
// ====== 2) TẠO ĐƠN HÀNG ======
async function createOrder(userId, payload) {
    const pricing = await calculatePricingFromCartSelection(userId, payload);
    const { shipping_address, orderItemsData, cartItemObjectIds, subtotal, discount_amount, shipping_fee, total_amount, discount_source, applied_coupon, } = pricing;
    const { note } = payload;
    const order_number = (0, generate_order_code_1.generateOrderNumber)();
    const [order] = await orders_model_1.Order.create([
        {
            order_number,
            user_id: userId,
            order_status: "pending",
            payment_status: "pending",
            subtotal,
            discount_amount,
            shipping_fee,
            total_amount,
            // Chỉ lưu coupon_code nếu thật sự dùng coupon
            coupon_code: discount_source === "coupon" && applied_coupon
                ? applied_coupon.code
                : null,
            note: note ?? null,
            shipping_address,
        },
    ]);
    const orderItemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: order._id,
    }));
    await orders_item_model_1.OrderItem.insertMany(orderItemsWithOrderId);
    if (orderItemsData.length > 0) {
        const bulkOps = orderItemsData.map((item) => ({
            updateOne: {
                filter: {
                    _id: item.variant_id,
                    stock: { $gte: item.quantity },
                },
                update: {
                    $inc: { stock: -item.quantity },
                },
            },
        }));
        await product_variants_model_1.ProductVariant.bulkWrite(bulkOps);
    }
    await cart_details_model_1.CartDetail.deleteMany({
        _id: { $in: cartItemObjectIds },
    });
    (0, socket_io_1.SEND_EVENT_TO_ADMINS)("admin:order:new", {
        order_id: order._id,
        order_number,
        total_amount,
        createdAt: order.createdAt,
    });
    return {
        order,
        items: orderItemsWithOrderId,
    };
}
// ====== 3) LIST ORDER CỦA USER (kèm items + thumbnail) ======
async function listMyOrders(userId, opts) {
    const { status, page = 1, limit = 10 } = opts;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const filter = { user_id: userId };
    if (status && status !== "all") {
        if (status === "cancel_requested") {
            filter.cancel_requested = true;
        }
        else if (status === "return_requested") {
            filter.return_requested = true;
        }
        else {
            filter.order_status = status;
        }
    }
    const [orders, total] = await Promise.all([
        orders_model_1.Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        orders_model_1.Order.countDocuments(filter),
    ]);
    if (orders.length === 0) {
        return {
            items: [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        };
    }
    const orderIds = orders.map((o) => o._id);
    const orderItems = await orders_item_model_1.OrderItem.find({
        order_id: { $in: orderIds },
    }).lean();
    const itemsByOrderId = new Map();
    for (const it of orderItems) {
        const key = String(it.order_id);
        if (!itemsByOrderId.has(key))
            itemsByOrderId.set(key, []);
        itemsByOrderId.get(key).push(it);
    }
    const productIds = Array.from(new Set(orderItems.map((it) => String(it.product_id)))).map((id) => new mongoose_1.Types.ObjectId(id));
    const products = await products_model_1.Product.find({
        _id: { $in: productIds },
    })
        .select("product_name thumbnail_url thumbnail slug")
        .lean();
    const productMap = new Map();
    for (const p of products) {
        productMap.set(String(p._id), p);
    }
    const itemsForClient = orders.map((o) => {
        const rawItems = itemsByOrderId.get(String(o._id)) || [];
        const mappedItems = rawItems.map((it) => {
            const product = productMap.get(String(it.product_id));
            const thumbnail_url = product?.thumbnail_url || product?.thumbnail || "";
            const variantNameParts = [];
            if (it.attributes?.frame_shape)
                variantNameParts.push(it.attributes.frame_shape);
            if (it.attributes?.frame_color)
                variantNameParts.push(it.attributes.frame_color);
            const variant_name = variantNameParts.join(" - ") || it.sku || "";
            return {
                product_id: String(it.product_id),
                product_name: it.name,
                slug: product?.slug || "",
                thumbnail_url,
                variant_name,
                quantity: it.quantity,
                price: it.unit_price,
            };
        });
        return {
            _id: o._id,
            code: o.order_number,
            shop_name: "Glasses Shop",
            status: o.order_status,
            cancel_requested: o.cancel_requested,
            return_requested: o.return_requested,
            total_amount: o.total_amount,
            created_at: o.createdAt,
            items: mappedItems,
        };
    });
    return {
        items: itemsForClient,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
        },
    };
}
// ====== 4) DETAIL ORDER CỦA USER ======
async function getMyOrderDetail(userId, orderId) {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new app_errol_1.BadRequestException("Invalid order id");
    }
    const order = await orders_model_1.Order.findOne({
        _id: orderId,
        user_id: userId,
    }).lean();
    if (!order) {
        throw new app_errol_1.NotFoundException("Order not found");
    }
    const items = await orders_item_model_1.OrderItem.find({ order_id: order._id }).lean();
    return { order, items };
}
// ====== 5) USER YÊU CẦU HUỶ ĐƠN ======
async function requestCancelMyOrder(userId, orderId) {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new app_errol_1.BadRequestException("Invalid order id");
    }
    const order = await orders_model_1.Order.findOne({
        _id: orderId,
        user_id: userId,
    });
    if (!order) {
        throw new app_errol_1.NotFoundException("Order not found");
    }
    if (!["pending", "processing", "shipping"].includes(order.order_status)) {
        throw new app_errol_1.ForbiddenException("This order cannot be cancelled at this stage");
    }
    if (order.cancel_requested) {
        throw new app_errol_1.BadRequestException("You already requested cancellation for this order");
    }
    order.cancel_requested = true;
    await order.save();
    (0, socket_io_1.SEND_EVENT_TO_USER)(String(userId), "order:cancel_requested", {
        order_id: order._id,
        order_number: order.order_number,
    });
    (0, socket_io_1.SEND_EVENT_TO_ADMINS)("admin:order:cancel_requested", {
        order_id: order._id,
        order_number: order.order_number,
        user_id: userId,
    });
    return order.toObject();
}
// ====== 6) USER MUA LẠI ĐƠN ======
async function reorderMyOrder(userId, orderId) {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new app_errol_1.BadRequestException("Invalid order id");
    }
    const order = await orders_model_1.Order.findOne({
        _id: orderId,
        user_id: userId,
    });
    if (!order) {
        throw new app_errol_1.NotFoundException("Order not found");
    }
    if (order.order_status !== "delivered") {
        throw new app_errol_1.ForbiddenException("Only completed orders can be reordered");
    }
    const items = await orders_item_model_1.OrderItem.find({ order_id: order._id }).lean();
    if (!items || items.length === 0) {
        throw new app_errol_1.NotFoundException("No order items to reorder");
    }
    let cart = await cart_model_1.Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await cart_model_1.Cart.create({ user_id: userId });
    }
    for (const it of items) {
        const variant = await product_variants_model_1.ProductVariant.findOne({
            _id: it.variant_id,
            is_active: true,
        }).lean();
        if (!variant) {
            continue;
        }
        const existing = await cart_details_model_1.CartDetail.findOne({
            cart_id: cart._id,
            variant_id: it.variant_id,
        });
        if (existing) {
            existing.quantity += it.quantity;
            await existing.save();
        }
        else {
            await cart_details_model_1.CartDetail.create({
                cart_id: cart._id,
                product_id: it.product_id,
                variant_id: it.variant_id,
                quantity: it.quantity,
                price_at_add: it.unit_price,
            });
        }
    }
    return { success: true };
}
// ====== 7) USER XÁC NHẬN ĐÃ NHẬN HÀNG ======
async function confirmDeliveredMyOrder(userId, orderId) {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new app_errol_1.BadRequestException("Invalid order id");
    }
    const order = await orders_model_1.Order.findOne({
        _id: orderId,
        user_id: userId,
    });
    if (!order) {
        throw new app_errol_1.NotFoundException("Order not found");
    }
    if (order.order_status !== "delivering") {
        throw new app_errol_1.ForbiddenException("You can only confirm delivery when order is delivering");
    }
    order.order_status = "delivered";
    await order.save();
    return order.toObject();
}
// ====== 8) USER YÊU CẦU TRẢ HÀNG ======
async function requestReturnMyOrder(userId, orderId) {
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw new app_errol_1.BadRequestException("Invalid order id");
    }
    const order = await orders_model_1.Order.findOne({
        _id: orderId,
        user_id: userId,
    });
    if (!order) {
        throw new app_errol_1.NotFoundException("Order not found");
    }
    if (order.order_status !== "delivered") {
        throw new app_errol_1.ForbiddenException("You can only request return when order is delivered");
    }
    if (order.return_requested) {
        throw new app_errol_1.BadRequestException("You already requested return for this order");
    }
    order.return_requested = true;
    await order.save();
    (0, socket_io_1.SEND_EVENT_TO_USER)(String(userId), "order:return_requested", {
        order_id: order._id,
        order_number: order.order_number,
    });
    (0, socket_io_1.SEND_EVENT_TO_ADMINS)("admin:order:return_requested", {
        order_id: order._id,
        order_number: order.order_number,
        user_id: userId,
    });
    return order.toObject();
}
// ====== EXPORT SERVICE ======
exports.orderService = {
    calculatePricingFromCartSelection,
    createOrder,
    listMyOrders,
    getMyOrderDetail,
    requestCancelMyOrder,
    reorderMyOrder,
    confirmDeliveredMyOrder,
    requestReturnMyOrder,
};
