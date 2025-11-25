import { ClientSession, Types } from "mongoose"
import { Order, IAddressSnapshot } from "../../../models/orders.model"
import { OrderItem } from "../../../models/orders.item.model"
import { Cart } from "../../../models/cart.model"
import { CartDetail } from "../../../models/cart.details.model"
import { ProductVariant } from "../../../models/product.variants.model"
import { Product } from "../../../models/products.model"
import { Coupon } from "../../../models/coupons.model"
import { UserCoupon } from "../../../models/user.coupons"
import { Promotion } from "../../../models/promotion.model"
import { PromotionBrand } from "../../../models/promotion.brand.model"
import { PromotionProduct } from "../../../models/promotion.product.model"
import { generateOrderNumber } from "../../../utils/generate_order_code"
import { addressService } from "./address.service"
import { shippingService } from "./shipping.serivce"
import AppError, {
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from "../../../utils/app_errol"
import { env } from "../../../config/environment"
import { SEND_EVENT_TO_ADMINS, SEND_EVENT_TO_USER } from "../../../config/socket.io"
import { Payment } from "../../../models/payments.model"
import { Notification } from "../../../models/notification.model"
import { getOrderThumbnail } from "../../../utils/get-order-thumbnail"
export type PaymentMethod = "cod" | "vnpay"
// ====== PAYLOAD TỪ CART (luồng giỏ hàng) ======
interface CartSelectionPayload {
    cart_item_ids: string[]
    address_id: string
    note?: string | null
    coupon_code?: string | null
    payment_method?: PaymentMethod
}

// ====== PAYLOAD TRỰC TIẾP (luồng Mua ngay) ======
interface DirectItemInput {
    variant_id: string
    quantity: number
}

interface DirectSelectionPayload {
    items: DirectItemInput[]
    address_id: string
    note?: string | null
    coupon_code?: string | null
    payment_method?: PaymentMethod   //
}

interface AppliedCoupon {
    _id: Types.ObjectId
    code: string
    type: "percent" | "fixed"
    value: number
    max_discount?: number | null
    min_order?: number | null
}

interface AppliedPromotion {
    _id: Types.ObjectId
    title: string
    discount_type: "percent" | "fixed"
    discount_value: number
    max_discount?: number | null
    min_order?: number | null
}

interface PricingResult {
    shipping_address: IAddressSnapshot
    orderItemsData: {
        product_id: Types.ObjectId
        variant_id: Types.ObjectId
        sku: string | null
        name: string
        attributes: any
        unit_price: number
        quantity: number
        total: number
    }[]
    cartItemObjectIds: Types.ObjectId[] // với mua ngay thì để [] là được

    subtotal: number
    discount_amount: number
    shipping_fee: number
    total_amount: number

    applied_coupon?: AppliedCoupon | null
    applied_promotion?: AppliedPromotion | null
    discount_source?: "none" | "coupon" | "promotion"
}

// ====== HELPER: TÍNH PROMOTION TỐT NHẤT ======
async function calculateBestPromotionDiscount(
    orderItemsData: PricingResult["orderItemsData"],
    products: any[]
): Promise<{ discount: number; promotion: AppliedPromotion | null }> {
    const now = new Date()

    const promotions = await Promotion.find({
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now },
    }).lean()

    if (!promotions.length) {
        return { discount: 0, promotion: null }
    }

    const promoIds = promotions.map((p) => p._id)

    const [brandLinks, productLinks] = await Promise.all([
        PromotionBrand.find({ promotion_id: { $in: promoIds } }).lean(),
        PromotionProduct.find({ promotion_id: { $in: promoIds } }).lean(),
    ])

    const brandsByPromo = new Map<string, Set<string>>()
    const productsByPromo = new Map<string, Set<string>>()

    for (const bl of brandLinks) {
        const key = String(bl.promotion_id)
        if (!brandsByPromo.has(key)) brandsByPromo.set(key, new Set())
        brandsByPromo.get(key)!.add(String(bl.brand_id))
    }

    for (const pl of productLinks) {
        const key = String(pl.promotion_id)
        if (!productsByPromo.has(key)) productsByPromo.set(key, new Set())
        productsByPromo.get(key)!.add(String(pl.product_id))
    }

    const productMap = new Map<string, any>()
    products.forEach((p) => productMap.set(String(p._id), p))

    let bestDiscount = 0
    let bestPromotion: any = null

    for (const promo of promotions) {
        const pId = String(promo._id)
        const brandSet = brandsByPromo.get(pId) ?? new Set<string>()
        const productSet = productsByPromo.get(pId) ?? new Set<string>()

        let eligibleSubtotal = 0

        for (const item of orderItemsData) {
            const product = productMap.get(String(item.product_id))
            if (!product) continue

            const productId = String(product._id)
            const brandId = product.brand_id ? String(product.brand_id) : null

            const matchByProduct = productSet.has(productId)
            const matchByBrand = brandId ? brandSet.has(brandId) : false

            if (!matchByProduct && !matchByBrand) continue

            eligibleSubtotal += item.total
        }

        if (eligibleSubtotal <= 0) continue

        if (promo.min_order != null && eligibleSubtotal < promo.min_order) {
            continue
        }

        let discount = 0
        if (promo.discount_type === "percent") {
            discount = (eligibleSubtotal * promo.discount_value) / 100
            if (promo.max_discount != null) {
                discount = Math.min(discount, promo.max_discount)
            }
        } else {
            discount = promo.discount_value
        }

        if (discount > eligibleSubtotal) {
            discount = eligibleSubtotal
        }

        if (
            discount > bestDiscount ||
            (discount === bestDiscount &&
                bestPromotion &&
                (promo.priority ?? 0) > (bestPromotion.priority ?? 0)) ||
            (discount === bestDiscount &&
                bestPromotion &&
                (promo.priority ?? 0) === (bestPromotion.priority ?? 0) &&
                promo.start_date > bestPromotion.start_date)
        ) {
            bestDiscount = discount
            bestPromotion = promo
        }
    }

    if (!bestPromotion || bestDiscount <= 0) {
        return { discount: 0, promotion: null }
    }

    const applied: AppliedPromotion = {
        _id: bestPromotion._id,
        title: bestPromotion.title,
        discount_type: bestPromotion.discount_type,
        discount_value: bestPromotion.discount_value,
        max_discount: bestPromotion.max_discount,
        min_order: bestPromotion.min_order,
    }

    return { discount: bestDiscount, promotion: applied }
}

// ====== 1) TÍNH GIÁ TỪ CART (luồng giỏ hàng – GIỮ NGUYÊN LOGIC CŨ) ======
async function calculatePricingFromCartSelection(
    userId: Types.ObjectId,
    payload: CartSelectionPayload,
    opts: { session?: ClientSession } = {}
): Promise<PricingResult> {
    const { session } = opts
    const { cart_item_ids, address_id, coupon_code } = payload

    if (!cart_item_ids || cart_item_ids.length === 0) {
        throw new BadRequestException("No cart items selected")
    }

    const cart = await Cart.findOne({ user_id: userId })
        .session(session || null)
        .lean()
    if (!cart) {
        throw new NotFoundException("Cart not found")
    }

    const cartItemObjectIds = cart_item_ids
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id))

    const cartItems = await CartDetail.find({
        _id: { $in: cartItemObjectIds },
        cart_id: cart._id,
    })
        .session(session || null)
        .lean()

    if (cartItems.length === 0) {
        throw new BadRequestException("Selected cart items not found")
    }

    // Address snapshot
    const addressDoc = await addressService.getMyAddressById(userId, address_id)
    if (!addressDoc) {
        throw new BadRequestException("Address not found")
    }

    const shipping_address: IAddressSnapshot = {
        recipient_name: addressDoc.recipient_name,
        phone: addressDoc.phone,
        province_code: addressDoc.province_code,
        district_code: addressDoc.district_code,
        ward_code: addressDoc.ward_code,
        specific_address: addressDoc.specific_address,
    }

    // Variants + products
    const variantIds = cartItems.map((ci) => ci.variant_id)
    const variants = await ProductVariant.find({
        _id: { $in: variantIds },
        is_active: true,
    })
        .session(session || null)
        .lean()

    if (variants.length === 0) {
        throw new BadRequestException("Variants not found or inactive")
    }

    const variantMap = new Map<string, any>()
    variants.forEach((v) => variantMap.set(String(v._id), v))

    const productIds = variants.map((v) => v.product_id)
    const products = await Product.find({
        _id: { $in: productIds },
    })
        .session(session || null)
        .lean()

    const productMap = new Map<string, any>()
    products.forEach((p) => productMap.set(String(p._id), p))

    // Build order items + subtotal
    let subtotal = 0
    const orderItemsData: PricingResult["orderItemsData"] = []

    for (const ci of cartItems) {
        const variant = variantMap.get(String(ci.variant_id))
        if (!variant) {
            throw new AppError("Variant not found or inactive", 400)
        }

        const product = productMap.get(String(variant.product_id))
        if (!product) {
            throw new AppError("Product not found", 400)
        }

        const unit_price = ci.price_at_add ?? variant.price
        const quantity = ci.quantity
        const total = unit_price * quantity

        if (variant.stock < quantity) {
            throw new BadRequestException(
                `Variant ${variant.sku_variant || variant._id} is out of stock`
            )
        }

        subtotal += total

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
        })
    }

    // ----------------- GIẢM GIÁ TỪ COUPON -----------------
    let couponDiscount = 0
    let applied_coupon: AppliedCoupon | null = null

    if (coupon_code) {
        const normalizedCode = coupon_code.trim().toUpperCase()

        const coupon = await Coupon.findOne({
            code: normalizedCode,
            is_active: true,
        })
            .session(session || null)
            .lean()

        if (!coupon) {
            throw new BadRequestException("Coupon not found or inactive")
        }

        const now = new Date()
        if (coupon.start_date && now < coupon.start_date) {
            throw new BadRequestException("Coupon not started yet")
        }
        if (coupon.end_date && now > coupon.end_date) {
            throw new BadRequestException("Coupon has expired")
        }

        if (coupon.min_order && subtotal < coupon.min_order) {
            throw new BadRequestException(
                `Order subtotal must be >= ${coupon.min_order} to use this coupon`
            )
        }

        if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
            const usedByUser = await UserCoupon.countDocuments({
                user_id: userId,
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null)
            if (usedByUser >= coupon.per_user_limit) {
                throw new BadRequestException("You have reached coupon usage limit")
            }
        }

        if (coupon.usage_limit != null && coupon.usage_limit > 0) {
            const usedTotal = await UserCoupon.countDocuments({
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null)
            if (usedTotal >= coupon.usage_limit) {
                throw new BadRequestException("Coupon usage limit has been reached")
            }
        }

        if (coupon.type === "percent") {
            couponDiscount = (subtotal * coupon.value) / 100
            if (coupon.max_discount != null) {
                couponDiscount = Math.min(couponDiscount, coupon.max_discount)
            }
        } else {
            couponDiscount = coupon.value
        }

        if (couponDiscount > subtotal) {
            couponDiscount = subtotal
        }

        applied_coupon = {
            _id: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount,
            min_order: coupon.min_order,
        }
    }

    // ----------------- GIẢM GIÁ TỪ PROMOTION TỰ ĐỘNG -----------------
    const {
        discount: promotionDiscount,
        promotion: applied_promotionObj,
    } = await calculateBestPromotionDiscount(orderItemsData, products)

    // ----------------- CHỌN NGUỒN GIẢM GIÁ TỐT NHẤT -----------------
    let discount_amount = 0
    let discount_source: "none" | "coupon" | "promotion" = "none"
    let applied_promotion: AppliedPromotion | null = null

    if (couponDiscount <= 0 && promotionDiscount <= 0) {
        discount_amount = 0
        discount_source = "none"
        applied_promotion = null
        applied_coupon = null
    } else if (couponDiscount >= promotionDiscount) {
        discount_amount = couponDiscount
        discount_source = couponDiscount > 0 ? "coupon" : "none"
        applied_promotion = null
        // giữ applied_coupon
    } else {
        discount_amount = promotionDiscount
        discount_source = "promotion"
        applied_promotion = applied_promotionObj
        // nếu chọn promotion thì bỏ coupon (mã user nhập nhưng không được áp)
        applied_coupon = null
    }

    // Shipping fee (GHN) – tính trên số tiền đã trừ discount
    const totalQuantity = orderItemsData.reduce(
        (sum, li) => sum + li.quantity,
        0
    )
    const weightPerItem = Number(env.REALISTIC_GRAM)
    const totalWeight = totalQuantity * weightPerItem

    const shippingQuote = await shippingService.quote({ // tính giá
        district_code: shipping_address.district_code,
        ward_code: shipping_address.ward_code,
        total_weight: totalWeight,
        order_amount: subtotal - discount_amount,
    })

    const shipping_fee = shippingQuote.shipping_fee ?? 0
    const total_amount = subtotal - discount_amount + shipping_fee

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
    }
}

// ====== 2) TÍNH GIÁ TỪ DIRECT ITEMS (luồng Mua ngay – KHÔNG DÙNG CART) ======
async function calculatePricingFromDirectSelection(
    userId: Types.ObjectId,
    payload: DirectSelectionPayload,
    opts: { session?: ClientSession } = {}
): Promise<PricingResult> {
    const { session } = opts
    const { items, address_id, coupon_code } = payload

    if (!items || items.length === 0) {
        throw new BadRequestException("No items selected")
    }

    // 1. Address snapshot
    const addressDoc = await addressService.getMyAddressById(userId, address_id)
    if (!addressDoc) {
        throw new BadRequestException("Address not found")
    }

    const shipping_address: IAddressSnapshot = {
        recipient_name: addressDoc.recipient_name,
        phone: addressDoc.phone,
        province_code: addressDoc.province_code,
        district_code: addressDoc.district_code,
        ward_code: addressDoc.ward_code,
        specific_address: addressDoc.specific_address,
    }

    // 2. Lấy variants từ items
    const variantIds = items
        .map((i) => i.variant_id)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id))

    const variants = await ProductVariant.find({
        _id: { $in: variantIds },
        is_active: true,
    })
        .session(session || null)
        .lean()

    if (variants.length === 0) {
        throw new BadRequestException("Variants not found or inactive")
    }

    const variantMap = new Map<string, any>()
    variants.forEach((v) => variantMap.set(String(v._id), v))

    // 3. Lấy products
    const productIds = variants.map((v) => v.product_id)
    const products = await Product.find({
        _id: { $in: productIds },
    })
        .session(session || null)
        .lean()

    const productMap = new Map<string, any>()
    products.forEach((p) => productMap.set(String(p._id), p))

    // 4. Build orderItemsData + subtotal
    let subtotal = 0
    const orderItemsData: PricingResult["orderItemsData"] = []

    for (const input of items) {
        const vId = String(input.variant_id)
        const variant = variantMap.get(vId)
        if (!variant) {
            throw new AppError("Variant not found or inactive", 400)
        }

        const product = productMap.get(String(variant.product_id))
        if (!product) {
            throw new AppError("Product not found", 400)
        }

        const quantity = input.quantity
        if (quantity <= 0) {
            throw new BadRequestException("Invalid quantity")
        }

        if (variant.stock < quantity) {
            throw new BadRequestException(
                `Variant ${variant.sku_variant || variant._id} is out of stock`
            )
        }

        const unit_price =
            (variant.sale_price && variant.sale_price > 0
                ? variant.sale_price
                : variant.price) ?? variant.price

        const total = unit_price * quantity
        subtotal += total

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
        })
    }

    // ----------------- GIẢM GIÁ TỪ COUPON -----------------
    let couponDiscount = 0
    let applied_coupon: AppliedCoupon | null = null

    if (coupon_code) {
        const normalizedCode = coupon_code.trim().toUpperCase()

        const coupon = await Coupon.findOne({
            code: normalizedCode,
            is_active: true,
        })
            .session(session || null)
            .lean()

        if (!coupon) {
            throw new BadRequestException("Coupon not found or inactive")
        }

        const now = new Date()
        if (coupon.start_date && now < coupon.start_date) {
            throw new BadRequestException("Coupon not started yet")
        }
        if (coupon.end_date && now > coupon.end_date) {
            throw new BadRequestException("Coupon has expired")
        }

        if (coupon.min_order && subtotal < coupon.min_order) {
            throw new BadRequestException(
                `Order subtotal must be >= ${coupon.min_order} to use this coupon`
            )
        }

        if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
            const usedByUser = await UserCoupon.countDocuments({
                user_id: userId,
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null)
            if (usedByUser >= coupon.per_user_limit) {
                throw new BadRequestException("You have reached coupon usage limit")
            }
        }

        if (coupon.usage_limit != null && coupon.usage_limit > 0) {
            const usedTotal = await UserCoupon.countDocuments({
                coupon_id: coupon._id,
                is_used: true,
            }).session(session || null)
            if (usedTotal >= coupon.usage_limit) {
                throw new BadRequestException("Coupon usage limit has been reached")
            }
        }

        if (coupon.type === "percent") {
            couponDiscount = (subtotal * coupon.value) / 100
            if (coupon.max_discount != null) {
                couponDiscount = Math.min(couponDiscount, coupon.max_discount)
            }
        } else {
            couponDiscount = coupon.value
        }

        if (couponDiscount > subtotal) {
            couponDiscount = subtotal
        }

        applied_coupon = {
            _id: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount,
            min_order: coupon.min_order,
        }
    }

    // ----------------- GIẢM GIÁ TỪ PROMOTION TỰ ĐỘNG -----------------
    const {
        discount: promotionDiscount,
        promotion: applied_promotionObj,
    } = await calculateBestPromotionDiscount(orderItemsData, products)

    // ----------------- CHỌN NGUỒN GIẢM GIÁ TỐT NHẤT -----------------
    let discount_amount = 0
    let discount_source: "none" | "coupon" | "promotion" = "none"
    let applied_promotion: AppliedPromotion | null = null

    if (couponDiscount <= 0 && promotionDiscount <= 0) {
        discount_amount = 0
        discount_source = "none"
        applied_promotion = null
        applied_coupon = null
    } else if (couponDiscount >= promotionDiscount) {
        discount_amount = couponDiscount
        discount_source = couponDiscount > 0 ? "coupon" : "none"
        applied_promotion = null
    } else {
        discount_amount = promotionDiscount
        discount_source = "promotion"
        applied_promotion = applied_promotionObj
        applied_coupon = null
    }

    const totalQuantity = orderItemsData.reduce(
        (sum, li) => sum + li.quantity,
        0
    )
    const weightPerItem = Number(env.REALISTIC_GRAM)
    const totalWeight = totalQuantity * weightPerItem

    const shippingQuote = await shippingService.quote({
        district_code: shipping_address.district_code,
        ward_code: shipping_address.ward_code,
        total_weight: totalWeight,
        order_amount: subtotal - discount_amount,
    })

    const shipping_fee = shippingQuote.shipping_fee ?? 0
    const total_amount = subtotal - discount_amount + shipping_fee

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
    }
}

// ====== 3) TẠO ORDER TỪ CART (luồng giỏ hàng – XOÁ CART ITEMS) ======
async function createOrder(
    userId: Types.ObjectId,
    payload: CartSelectionPayload
) {
    const pricing = await calculatePricingFromCartSelection(userId, payload)

    const {
        shipping_address,
        orderItemsData,
        cartItemObjectIds,
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        discount_source,
        applied_coupon,
    } = pricing

    const { note, payment_method } = payload
    const order_number = generateOrderNumber()

    const [order] = await Order.create([
        {
            order_number,
            user_id: userId,
            order_status: "pending",
            payment_status: "pending",
            subtotal,
            discount_amount,
            shipping_fee,
            total_amount,
            coupon_code:
                discount_source === "coupon" && applied_coupon
                    ? applied_coupon.code
                    : null,
            note: note ?? null,
            shipping_address,
        },
    ])
    const provider: "cod" | "vnpay" =
        payment_method === "vnpay" ? "vnpay" : "cod"

    let payment = await Payment.findOne({ order_id: order._id })

    if (!payment) {
        payment = await Payment.create({
            user_id: userId,
            order_id: order._id,
            provider,              // 'cod' | 'vnpay'
            amount: total_amount,
            status: "pending",     // mới tạo => pending
            paidAt: null,
        })
    }

    const orderItemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: order._id,
    }))

    await OrderItem.insertMany(orderItemsWithOrderId)

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
        }))

        await ProductVariant.bulkWrite(bulkOps)
    }

    // XOÁ CART ITEMS khi đặt từ giỏ
    if (cartItemObjectIds.length > 0) {
        await CartDetail.deleteMany({
            _id: { $in: cartItemObjectIds },
        })
    }

    // ----- Notification & Socket -----
    let thumbnailUrl: string | null = null
    if (orderItemsData.length > 0) {
        const firstItem = orderItemsData[0]
        const product = await Product.findById(firstItem.product_id)
            .select("thumbnail_url")
            .lean()
        thumbnailUrl = product?.thumbnail_url || null
    }

    const formattedTotal = total_amount.toLocaleString("vi-VN")

    // Thông báo cho USER
    await Notification.create({
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
    })

    // Nếu dùng coupon thì cập nhật usage
    if (discount_source === "coupon" && applied_coupon) {
        await UserCoupon.findOneAndUpdate(
            {
                user_id: userId,
                coupon_id: applied_coupon._id,
            },
            {
                is_used: true,
                used_at: new Date(),
            }
        )

        await Coupon.findByIdAndUpdate(applied_coupon._id, {
            $inc: { used_count: 1 },
        })
    }

    // Thông báo cho ADMIN
    await Notification.create({
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
    })

    SEND_EVENT_TO_ADMINS("admin:order:new", {
        order_id: order._id,
        order_number,
        total_amount,
        createdAt: order.createdAt,
    })
    return {
        order,
        items: orderItemsWithOrderId,
    }
}

// ====== 4) TẠO ORDER TỪ DIRECT ITEMS (Mua ngay – KHÔNG XOÁ CART) ======
async function createOrderFromDirect(
    userId: Types.ObjectId,
    payload: DirectSelectionPayload
) {
    const pricing = await calculatePricingFromDirectSelection(userId, payload)

    const {
        shipping_address,
        orderItemsData,
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        discount_source,
        applied_coupon,
    } = pricing

    const { note, payment_method } = payload
    const order_number = generateOrderNumber()

    const [order] = await Order.create([
        {
            order_number,
            user_id: userId,
            order_status: "pending",
            payment_status: "pending",
            subtotal,
            discount_amount,
            shipping_fee,
            total_amount,
            coupon_code:
                discount_source === "coupon" && applied_coupon
                    ? applied_coupon.code
                    : null,
            note: note ?? null,
            shipping_address,
        },
    ])
    const provider: "cod" | "vnpay" =
        payment_method === "vnpay" ? "vnpay" : "cod"

    let payment = await Payment.findOne({ order_id: order._id })

    if (!payment) {
        payment = await Payment.create({
            user_id: userId,
            order_id: order._id,
            provider,
            amount: total_amount,
            status: "pending",
            paidAt: null,
        })
    }
    const orderItemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: order._id,
    }))

    await OrderItem.insertMany(orderItemsWithOrderId)

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
        }))

        await ProductVariant.bulkWrite(bulkOps)
    }



    // ----- Notification & Socket -----
    let thumbnailUrl: string | null = null
    if (orderItemsData.length > 0) {
        const firstItem = orderItemsData[0]
        const product = await Product.findById(firstItem.product_id)
            .select("thumbnail_url")
            .lean()
        thumbnailUrl = product?.thumbnail_url || null
    }

    const formattedTotal = total_amount.toLocaleString("vi-VN")

    if (discount_source === "coupon" && applied_coupon) {
        await UserCoupon.findOneAndUpdate(
            {
                user_id: userId,
                coupon_id: applied_coupon._id,
            },
            {
                is_used: true,
                used_at: new Date(),
            }
        )

        await Coupon.findByIdAndUpdate(applied_coupon._id, {
            $inc: { used_count: 1 },
        })
    }

    // Thông báo USER
    await Notification.create({
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
    })

    // Thông báo ADMIN
    await Notification.create({
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
    })

    SEND_EVENT_TO_ADMINS("admin:order:new", {
        order_id: order._id,
        order_number,
        total_amount,
        createdAt: order.createdAt,
    })
    return {
        order,
        items: orderItemsWithOrderId,
    }
}

// ====== 5) LIST ORDER CỦA USER (kèm items + thumbnail) ======
async function listMyOrders(
    userId: Types.ObjectId,
    opts: { status?: string; page?: number; limit?: number }
) {
    const { status, page = 1, limit = 10 } = opts

    const pageNum = Math.max(Number(page) || 1, 1)
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50)

    const filter: any = { user_id: userId }

    if (status && status !== "all") {
        if (status === "cancel_requested") {
            filter.cancel_requested = true
        } else if (status === "return_requested") {
            filter.return_requested = true
        } else {
            filter.order_status = status
        }
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        Order.countDocuments(filter),
    ])

    if (orders.length === 0) {
        return {
            items: [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        }
    }

    const orderIds = orders.map((o) => o._id)

    const orderItems = await OrderItem.find({
        order_id: { $in: orderIds },
    }).lean()

    const itemsByOrderId = new Map<string, any[]>()
    for (const it of orderItems) {
        const key = String(it.order_id)
        if (!itemsByOrderId.has(key)) itemsByOrderId.set(key, [])
        itemsByOrderId.get(key)!.push(it)
    }

    const productIds = Array.from(
        new Set(orderItems.map((it) => String(it.product_id)))
    ).map((id) => new Types.ObjectId(id))

    const products = await Product.find({
        _id: { $in: productIds },
    })
        .select("product_name thumbnail_url slug")
        .lean()

    const productMap = new Map<string, any>()
    for (const p of products) {
        productMap.set(String(p._id), p)
    }

    const itemsForClient = orders.map((o) => {
        const rawItems = itemsByOrderId.get(String(o._id)) || []

        const mappedItems = rawItems.map((it: any) => {
            const product = productMap.get(String(it.product_id))
            const thumbnail_url =
                product?.thumbnail_url || product?.thumbnail || ""

            const variantNameParts: string[] = []
            if (it.attributes?.frame_shape)
                variantNameParts.push(it.attributes.frame_shape)
            if (it.attributes?.frame_color)
                variantNameParts.push(it.attributes.frame_color)
            const variant_name = variantNameParts.join(" - ") || it.sku || ""

            return {
                product_id: String(it.product_id),
                product_name: it.name,
                slug: product?.slug || "",
                thumbnail_url,
                variant_name,
                quantity: it.quantity,
                price: it.unit_price,
            }
        })

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
        }
    })

    return {
        items: itemsForClient,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
        },
    }
}

// ====== 6) DETAIL ORDER CỦA USER ======
async function getMyOrderDetail(userId: Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Invalid order id")
    }

    const order = await Order.findOne({
        _id: orderId,
        user_id: userId,
    }).lean()

    if (!order) {
        throw new NotFoundException("Order not found")
    }

    const items = await OrderItem.find({ order_id: order._id }).lean()

    return { order, items }
}

// ====== 7) USER YÊU CẦU HUỶ ĐƠN ======
async function requestCancelMyOrder(userId: Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Invalid order id")
    }

    const order = await Order.findOne({
        _id: orderId,
        user_id: userId,
    })

    if (!order) {
        throw new NotFoundException("Order not found")
    }

    if (!["pending", "processing", "shipping"].includes(order.order_status)) {
        throw new ForbiddenException("This order cannot be cancelled at this stage")
    }

    if (order.cancel_requested) {
        throw new BadRequestException("You already requested cancellation for this order")
    }

    order.cancel_requested = true
    await order.save()
    const thumbnailUrl = await getOrderThumbnail(orderId);

    // Thông báo cho USER
    await Notification.create({
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
    })

    SEND_EVENT_TO_USER(String(userId), "order:cancel_requested", {
        order_id: order._id,
        order_number: order.order_number,
    })

    // Thông báo cho ADMIN
    await Notification.create({
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
    })

    SEND_EVENT_TO_ADMINS("admin:order:cancel_requested", {
        order_id: order._id,
        order_number: order.order_number,
        user_id: userId,
    })

    return order.toObject()
}

// ====== 8) MUA LẠI ======
async function reorderMyOrder(userId: Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Invalid order id")
    }

    const order = await Order.findOne({
        _id: orderId,
        user_id: userId,
    })

    if (!order) {
        throw new NotFoundException("Order not found")
    }

    if (order.order_status !== "delivered") {
        throw new ForbiddenException("Only completed orders can be reordered")
    }

    const items = await OrderItem.find({ order_id: order._id }).lean()
    if (!items || items.length === 0) {
        throw new NotFoundException("No order items to reorder")
    }

    let cart = await Cart.findOne({ user_id: userId })
    if (!cart) {
        cart = await Cart.create({ user_id: userId })
    }

    for (const it of items) {
        const variant = await ProductVariant.findOne({
            _id: it.variant_id,
            is_active: true,
        }).lean()

        if (!variant) {
            continue
        }

        const existing = await CartDetail.findOne({
            cart_id: cart._id,
            variant_id: it.variant_id,
        })

        if (existing) {
            existing.quantity += it.quantity
            await existing.save()
        } else {
            await CartDetail.create({
                cart_id: cart._id,
                product_id: it.product_id,
                variant_id: it.variant_id,
                quantity: it.quantity,
                price_at_add: it.unit_price,
            })
        }
    }

    return { success: true }
}

// ====== 9) USER XÁC NHẬN ĐÃ NHẬN HÀNG ======
async function confirmDeliveredMyOrder(userId: Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Invalid order id")
    }

    const order = await Order.findOne({
        _id: orderId,
        user_id: userId,
    })

    if (!order) {
        throw new NotFoundException("Order not found")
    }

    if (order.order_status !== "delivering") {
        throw new ForbiddenException("You can only confirm delivery when order is delivering")
    }

    const payment = await Payment.findOne({ order_id: orderId })
    if (!payment) {
        // Với thiết kế mới, case này là data lỗi
        throw new NotFoundException("Payment not found")
    }

    if (payment.provider === "cod") {
        // COD: đến lúc user bấm "Đã nhận hàng" mới coi là thanh toán thành công
        if (payment.status !== "pending") {
            throw new ForbiddenException("COD payment must be pending to confirm")
        }

        payment.status = "success"
        payment.paidAt = new Date()
        order.payment_status = "success"
    } else {
        // Online: yêu cầu trước đó đã được VNPay/… set success
        if (payment.status !== "success") {
            throw new ForbiddenException("Online payment is not completed yet")
        }
    }


    order.order_status = "delivered"

    await payment.save()
    await order.save()

    // Lấy tất cả order_items của đơn này
    const items = await OrderItem.find({ order_id: order._id }).lean()

    if (items.length > 0) {
        const bulkOps = items.map((it) => ({
            updateOne: {
                filter: { _id: it.product_id },
                update: { $inc: { selled_amount: it.quantity } },
            },
        }))

        await Product.bulkWrite(bulkOps)
    }
    return order.toObject()
}

// ====== 10) USER YÊU CẦU TRẢ HÀNG ======
async function requestReturnMyOrder(userId: Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Invalid order id")
    }

    const order = await Order.findOne({
        _id: orderId,
        user_id: userId,
    })

    if (!order) {
        throw new NotFoundException("Order not found")
    }

    if (order.order_status !== "delivered") {
        throw new ForbiddenException("You can only request return when order is delivered")
    }

    if (order.return_requested) {
        throw new BadRequestException("You already requested return for this order")
    }

    order.return_requested = true
    await order.save()

    const thumbnailUrl = await getOrderThumbnail(orderId);

    await Notification.create({
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
    })

    SEND_EVENT_TO_USER(String(userId), "order:return_requested", {
        order_id: order._id,
        order_number: order.order_number,
    })

    // Thông báo ADMIN
    await Notification.create({
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
    })

    SEND_EVENT_TO_ADMINS("admin:order:return_requested", {
        order_id: order._id,
        order_number: order.order_number,
        user_id: userId,
    })

    return order.toObject()
}

// ====== EXPORT SERVICE ======
export const orderService = {
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
}
