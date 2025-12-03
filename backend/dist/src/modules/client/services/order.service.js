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
exports.getMyOrderDetail = getMyOrderDetail;
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
const payments_model_1 = require("../../../models/payments.model");
const notification_model_1 = require("../../../models/notification.model");
const get_order_thumbnail_1 = require("../../../utils/get-order-thumbnail");
const geo_service_1 = require("./geo.service");
const products_image_model_1 = require("../../../models/products.image.model");
function buildUserStatusFilter(status) {
    const filter = {};
    if (!status || status === "all")
        return filter;
    if (status === "cancel_requested") {
        filter.cancel_requested = true;
        filter.order_status = { $ne: "cancelled" };
        return filter;
    }
    if (status === "return_requested") {
        filter.return_requested = true;
        filter.order_status = "delivered";
        return filter;
    }
    // các trạng thái bình thường
    filter.order_status = status;
    if (["pending", "processing", "shipping", "delivering", "delivered"].includes(status)) {
        filter.cancel_requested = { $ne: true };
        filter.return_requested = { $ne: true };
    }
    return filter;
}
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
// ====== 1) TÍNH GIÁ TỪ CART (luồng giỏ hàng – GIỮ NGUYÊN LOGIC CŨ) ======
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
// ====== 2) TÍNH GIÁ TỪ DIRECT ITEMS (luồng Mua ngay – KHÔNG DÙNG CART) ======
async function calculatePricingFromDirectSelection(userId, payload, opts = {}) {
    const { session } = opts;
    const { items, address_id, coupon_code } = payload;
    if (!items || items.length === 0) {
        throw new app_errol_1.BadRequestException("No items selected");
    }
    // 1. Address snapshot
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
    // 2. Lấy variants từ items
    const variantIds = items
        .map((i) => i.variant_id)
        .filter((id) => mongoose_1.Types.ObjectId.isValid(id))
        .map((id) => new mongoose_1.Types.ObjectId(id));
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
    // 3. Lấy products
    const productIds = variants.map((v) => v.product_id);
    const products = await products_model_1.Product.find({
        _id: { $in: productIds },
    })
        .session(session || null)
        .lean();
    const productMap = new Map();
    products.forEach((p) => productMap.set(String(p._id), p));
    // 4. Build orderItemsData + subtotal
    let subtotal = 0;
    const orderItemsData = [];
    for (const input of items) {
        const vId = String(input.variant_id);
        const variant = variantMap.get(vId);
        if (!variant) {
            throw new app_errol_1.default("Variant not found or inactive", 400);
        }
        const product = productMap.get(String(variant.product_id));
        if (!product) {
            throw new app_errol_1.default("Product not found", 400);
        }
        const quantity = input.quantity;
        if (quantity <= 0) {
            throw new app_errol_1.BadRequestException("Invalid quantity");
        }
        if (variant.stock < quantity) {
            throw new app_errol_1.BadRequestException(`Variant ${variant.sku_variant || variant._id} is out of stock`);
        }
        const unit_price = (variant.sale_price && variant.sale_price > 0
            ? variant.sale_price
            : variant.price) ?? variant.price;
        const total = unit_price * quantity;
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
    }
    else {
        discount_amount = promotionDiscount;
        discount_source = "promotion";
        applied_promotion = applied_promotionObj;
        applied_coupon = null;
    }
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
        cartItemObjectIds: [], // mua ngay không liên quan cart
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        applied_coupon,
        applied_promotion,
        discount_source,
    };
}
// ====== 3) TẠO ORDER TỪ CART (luồng giỏ hàng – XOÁ CART ITEMS) ======
async function createOrder(userId, payload) {
    const pricing = await calculatePricingFromCartSelection(userId, payload);
    const { shipping_address, orderItemsData, cartItemObjectIds, subtotal, discount_amount, shipping_fee, total_amount, discount_source, applied_coupon, } = pricing;
    const { note, payment_method } = payload;
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
            coupon_code: discount_source === "coupon" && applied_coupon
                ? applied_coupon.code
                : null,
            note: note ?? null,
            shipping_address,
        },
    ]);
    const provider = payment_method === "vnpay" ? "vnpay" : "cod";
    let payment = await payments_model_1.Payment.findOne({ order_id: order._id });
    if (!payment) {
        payment = await payments_model_1.Payment.create({
            user_id: userId,
            order_id: order._id,
            provider, // 'cod' | 'vnpay'
            amount: total_amount,
            status: "pending", // mới tạo => pending
            paidAt: null,
        });
    }
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
    // XOÁ CART ITEMS khi đặt từ giỏ
    if (cartItemObjectIds.length > 0) {
        await cart_details_model_1.CartDetail.deleteMany({
            _id: { $in: cartItemObjectIds },
        });
    }
    // ----- Notification & Socket -----
    let thumbnailUrl = null;
    if (orderItemsData.length > 0) {
        const firstItem = orderItemsData[0];
        const product = await products_model_1.Product.findById(firstItem.product_id)
            .select("thumbnail_url")
            .lean();
        thumbnailUrl = product?.thumbnail_url || null;
    }
    const formattedTotal = total_amount.toLocaleString("vi-VN");
    // Thông báo cho USER
    await notification_model_1.Notification.create({
        audience: "user",
        user_id: userId,
        category: "order",
        type: "user:order_created",
        title: `Đặt hàng thành công #${order_number}`,
        message: `Đơn hàng trị giá ${formattedTotal}₫ đã được tạo, vui lòng chờ shop xác nhận.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            total_amount,
        },
    });
    // Nếu dùng coupon thì cập nhật usage
    if (discount_source === "coupon" && applied_coupon) {
        await user_coupons_1.UserCoupon.findOneAndUpdate({
            user_id: userId,
            coupon_id: applied_coupon._id,
        }, {
            is_used: true,
            used_at: new Date(),
        });
        await coupons_model_1.Coupon.findByIdAndUpdate(applied_coupon._id, {
            $inc: { used_count: 1 },
        });
    }
    // Thông báo cho ADMIN
    await notification_model_1.Notification.create({
        audience: "admin",
        user_id: null,
        category: "order",
        type: "admin:new_order",
        title: `Đơn hàng mới #${order_number}`,
        message: `User ${String(userId)} vừa tạo đơn hàng ${formattedTotal}₫.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            total_amount,
            user_id: userId,
        },
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
async function getMyOrderStatusStats(userId) {
    const keys = [
        "all",
        "pending",
        "processing",
        "shipping",
        "delivering",
        "delivered",
        "cancelled",
        "returned",
        "cancel_requested",
        "return_requested",
    ];
    const results = await Promise.all(keys.map((key) => {
        if (key === "all") {
            return orders_model_1.Order.countDocuments({ user_id: userId });
        }
        const statusFilter = buildUserStatusFilter(key);
        return orders_model_1.Order.countDocuments({ user_id: userId, ...statusFilter });
    }));
    const [all, pending, processing, shipping, delivering, delivered, cancelled, returned, cancelRequested, returnRequested,] = results;
    return {
        all,
        pending,
        processing,
        shipping,
        delivering,
        delivered,
        cancelled,
        returned,
        cancel_requested: cancelRequested,
        return_requested: returnRequested,
    };
}
// ====== 4) TẠO ORDER TỪ DIRECT ITEMS (Mua ngay – KHÔNG XOÁ CART) ======
async function createOrderFromDirect(userId, payload) {
    const pricing = await calculatePricingFromDirectSelection(userId, payload);
    const { shipping_address, orderItemsData, subtotal, discount_amount, shipping_fee, total_amount, discount_source, applied_coupon, } = pricing;
    const { note, payment_method } = payload;
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
            coupon_code: discount_source === "coupon" && applied_coupon
                ? applied_coupon.code
                : null,
            note: note ?? null,
            shipping_address,
        },
    ]);
    const provider = payment_method === "vnpay" ? "vnpay" : "cod";
    let payment = await payments_model_1.Payment.findOne({ order_id: order._id });
    if (!payment) {
        payment = await payments_model_1.Payment.create({
            user_id: userId,
            order_id: order._id,
            provider,
            amount: total_amount,
            status: "pending",
            paidAt: null,
        });
    }
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
    // ----- Notification & Socket -----
    let thumbnailUrl = null;
    if (orderItemsData.length > 0) {
        const firstItem = orderItemsData[0];
        const product = await products_model_1.Product.findById(firstItem.product_id)
            .select("thumbnail_url")
            .lean();
        thumbnailUrl = product?.thumbnail_url || null;
    }
    const formattedTotal = total_amount.toLocaleString("vi-VN");
    if (discount_source === "coupon" && applied_coupon) {
        await user_coupons_1.UserCoupon.findOneAndUpdate({
            user_id: userId,
            coupon_id: applied_coupon._id,
        }, {
            is_used: true,
            used_at: new Date(),
        });
        await coupons_model_1.Coupon.findByIdAndUpdate(applied_coupon._id, {
            $inc: { used_count: 1 },
        });
    }
    // Thông báo USER
    await notification_model_1.Notification.create({
        audience: "user",
        user_id: userId,
        category: "order",
        type: "user:order_created",
        title: `Đặt hàng thành công #${order_number}`,
        message: `Đơn hàng trị giá ${formattedTotal}₫ đã được tạo, vui lòng chờ shop xác nhận.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            total_amount,
        },
    });
    // Thông báo ADMIN
    await notification_model_1.Notification.create({
        audience: "admin",
        user_id: null,
        category: "order",
        type: "admin:new_order",
        title: `Đơn hàng mới #${order_number}`,
        message: `User ${String(userId)} vừa tạo đơn hàng ${formattedTotal}₫.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            total_amount,
            user_id: userId,
        },
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
// ====== 5) LIST ORDER CỦA USER (kèm items + thumbnail) ======
async function listMyOrders(userId, opts) {
    const { status, page = 1, limit = 10 } = opts;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const filter = { user_id: userId };
    Object.assign(filter, buildUserStatusFilter(status));
    // if (status && status !== "all") {
    //     if (status === "cancel_requested") {
    //         filter.cancel_requested = true
    //     } else if (status === "return_requested") {
    //         filter.return_requested = true
    //     } else {
    //         filter.order_status = status
    //     }
    // }
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
        .select("product_name thumbnail_url slug")
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
// ====== 6) DETAIL ORDER CỦA USER ======
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
    // ====== ENRICH ĐỊA CHỈ GỐC -> FULL_ADDRESS ======
    if (order.shipping_address) {
        const { province_code, district_code, ward_code, specific_address, } = order.shipping_address;
        const geo = await geo_service_1.geoService.getAddressDetails(province_code, district_code, ward_code);
        order.shipping_address = {
            ...order.shipping_address,
            province_name: geo.province_name,
            district_name: geo.district_name,
            ward_name: geo.ward_name,
            full_address: [
                geo.full_location, // "Phường 4, Quận Tân Bình, Hồ Chí Minh"
            ]
                .filter(Boolean)
                .join(", "),
        };
    }
    // ====== LẤY ITEM GỐC ======
    let items = await orders_item_model_1.OrderItem.find({ order_id: order._id }).lean();
    if (items.length === 0) {
        return { order, items };
    }
    // ====== LẤY LIST product_id & variant_id ======
    const productIds = Array.from(new Set(items
        .map((it) => it.product_id)
        .filter(Boolean)
        .map((id) => id.toString())));
    const variantIds = Array.from(new Set(items
        .map((it) => it.variant_id)
        .filter(Boolean)
        .map((id) => id.toString())));
    // ====== QUERY PRODUCT + ẢNH VARIANT ======
    const [products, variantImages] = await Promise.all([
        products_model_1.Product.find({
            _id: { $in: productIds },
        })
            .select("_id product_name slug thumbnail_url")
            .lean(),
        // Lấy ảnh theo variant, ưu tiên position nhỏ nhất (ảnh đầu tiên)
        variantIds.length
            ? products_image_model_1.ProductImage.find({
                variant_id: { $in: variantIds },
                url: { $ne: null },
            })
                .sort({ position: 1 })
                .lean()
            : Promise.resolve([]),
    ]);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    // Map variant_id -> url ảnh đầu tiên
    const variantImageMap = new Map();
    for (const img of variantImages) {
        const vid = img.variant_id?.toString();
        if (!vid)
            continue;
        // chỉ lấy ảnh đầu tiên cho mỗi variant
        if (!variantImageMap.has(vid) && img.url) {
            variantImageMap.set(vid, img.url);
        }
    }
    // ====== ENRICH ITEM: thumbnail_url, product_name, slug (nếu muốn) ======
    const hydratedItems = items.map((it) => {
        const pid = it.product_id?.toString();
        const vid = it.variant_id?.toString();
        const product = pid ? productMap.get(pid) : null;
        const variantImageUrl = vid ? variantImageMap.get(vid) : null;
        const thumbnail_url = variantImageUrl || product?.thumbnail_url || null;
        return {
            ...it,
            thumbnail_url,
            // muốn đồng bộ tên sản phẩm theo Product luôn cũng được
            product_name: product?.product_name ?? it.name,
            slug: product?.slug,
        };
    });
    return { order, items: hydratedItems };
}
// ====== 7) USER YÊU CẦU HUỶ ĐƠN ======
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
    const thumbnailUrl = await (0, get_order_thumbnail_1.getOrderThumbnail)(orderId);
    // Thông báo cho USER
    await notification_model_1.Notification.create({
        audience: "user",
        user_id: userId,
        category: "order",
        type: "user:order_cancel_requested",
        title: `Yêu cầu huỷ đơn #${order.order_number}`,
        message: "Bạn đã gửi yêu cầu huỷ đơn, vui lòng chờ shop xử lý.",
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            action: "cancel_requested",
        },
    });
    // Thông báo cho ADMIN
    await notification_model_1.Notification.create({
        audience: "admin",
        user_id: null,
        category: "order",
        type: "admin:cancel_requested",
        title: `Yêu cầu huỷ đơn #${order.order_number}`,
        message: `Người dùng ${String(userId)} đã yêu cầu huỷ đơn.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            user_id: userId,
            action: "cancel_requested",
        },
    });
    (0, socket_io_1.SEND_EVENT_TO_ADMINS)("admin:order:cancel_requested", {
        order_id: order._id,
        order_number: order.order_number,
        user_id: userId,
    });
    return order.toObject();
}
// ====== 8) MUA LẠI ======
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
// ====== 9) USER XÁC NHẬN ĐÃ NHẬN HÀNG ======
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
    const payment = await payments_model_1.Payment.findOne({ order_id: orderId });
    if (!payment) {
        // Với thiết kế mới, case này là data lỗi
        throw new app_errol_1.NotFoundException("Payment not found");
    }
    if (payment.provider === "cod") {
        // COD: đến lúc user bấm "Đã nhận hàng" mới coi là thanh toán thành công
        if (payment.status !== "pending") {
            throw new app_errol_1.ForbiddenException("COD payment must be pending to confirm");
        }
        payment.status = "success";
        payment.paidAt = new Date();
        order.payment_status = "success";
    }
    else {
        // Online: yêu cầu trước đó đã được VNPay/… set success
        if (payment.status !== "success") {
            throw new app_errol_1.ForbiddenException("Online payment is not completed yet");
        }
    }
    order.order_status = "delivered";
    await payment.save();
    await order.save();
    // Lấy tất cả order_items của đơn này
    const items = await orders_item_model_1.OrderItem.find({ order_id: order._id }).lean();
    if (items.length > 0) {
        const bulkOps = items.map((it) => ({
            updateOne: {
                filter: { _id: it.product_id },
                update: { $inc: { selled_amount: it.quantity } },
            },
        }));
        await products_model_1.Product.bulkWrite(bulkOps);
    }
    return order.toObject();
}
// ====== 10) USER YÊU CẦU TRẢ HÀNG ======
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
    const thumbnailUrl = await (0, get_order_thumbnail_1.getOrderThumbnail)(orderId);
    await notification_model_1.Notification.create({
        audience: "user",
        user_id: userId,
        category: "order",
        type: "user:order_return_requested",
        title: `Yêu cầu trả hàng #${order.order_number}`,
        message: "Bạn đã gửi yêu cầu trả hàng, vui lòng chờ shop xử lý.",
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            action: "return_requested",
        },
    });
    (0, socket_io_1.SEND_EVENT_TO_USER)(String(userId), "order:return_requested", {
        order_id: order._id,
        order_number: order.order_number,
    });
    // Thông báo ADMIN
    await notification_model_1.Notification.create({
        audience: "admin",
        user_id: null,
        category: "order",
        type: "admin:return_requested",
        title: `Yêu cầu trả hàng #${order.order_number}`,
        message: `Người dùng ${String(userId)} đã yêu cầu trả hàng.`,
        thumbnail_url: thumbnailUrl,
        meta: {
            order_id: order._id,
            order_number: order.order_number,
            user_id: userId,
            action: "return_requested",
        },
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
    calculatePricingFromDirectSelection,
    createOrder,
    createOrderFromDirect,
    listMyOrders,
    getMyOrderDetail,
    requestCancelMyOrder,
    reorderMyOrder,
    confirmDeliveredMyOrder,
    requestReturnMyOrder,
    getMyOrderStatusStats
};
