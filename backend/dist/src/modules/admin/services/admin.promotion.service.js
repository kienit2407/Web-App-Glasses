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
exports.adminPromotionService = void 0;
const mongoose_1 = require("mongoose");
const promotion_model_1 = require("../../../models/promotion.model");
const promotion_coupon_model_1 = require("../../../models/promotion.coupon.model");
const promotion_brand_model_1 = require("../../../models/promotion.brand.model");
const promotion_product_model_1 = require("../../../models/promotion.product.model");
const coupons_model_1 = require("../../../models/coupons.model");
const brands_model_1 = require("../../../models/brands.model");
const products_model_1 = require("../../../models/products.model");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
const cloudinary_1 = require("../../../config/cloudinary");
exports.adminPromotionService = {
    // ========== LIST ==========
    async list(params) {
        const { page = 1, limit = 20, title, is_active, from_date, to_date, } = params;
        const filter = {};
        if (title) {
            filter.title = new RegExp(title.trim(), "i");
        }
        if (typeof is_active === "boolean") {
            filter.is_active = is_active;
        }
        if (from_date || to_date) {
            filter.start_date = {};
            if (from_date) {
                const d = new Date(from_date);
                if (isNaN(d.getTime()))
                    throw new app_errol_1.BadRequestException("Invalid from_date");
                filter.start_date.$gte = d;
            }
            if (to_date) {
                const d = new Date(to_date);
                if (isNaN(d.getTime()))
                    throw new app_errol_1.BadRequestException("Invalid to_date");
                filter.start_date.$lte = d;
            }
        }
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            promotion_model_1.Promotion.find(filter)
                .sort({ priority: -1, start_date: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            promotion_model_1.Promotion.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limitNum) || 1;
        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
    },
    // ========== CREATE ==========
    async create(payload) {
        let { title, description, banner_url, banner_id, start_date, end_date, is_active, priority, discount_type, discount_value, max_discount, min_order, } = payload;
        if (!title || !start_date || !end_date) {
            throw new app_errol_1.BadRequestException("title, start_date, end_date are required");
        }
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()))
            throw new app_errol_1.BadRequestException("Invalid start_date");
        if (isNaN(end.getTime()))
            throw new app_errol_1.BadRequestException("Invalid end_date");
        if (end < start) {
            throw new app_errol_1.BadRequestException("end_date must be >= start_date");
        }
        const promotion = await promotion_model_1.Promotion.create({
            title: title.trim(),
            description: description ?? null,
            banner_url: banner_url ?? null,
            banner_id: banner_id ?? null,
            start_date: start,
            end_date: end,
            is_active: false,
            priority: priority ?? 0,
            discount_type,
            discount_value,
            max_discount,
            min_order,
        });
        return promotion.toObject();
    },
    // ========== UPDATE ==========
    async update(id, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const promotion = await promotion_model_1.Promotion.findById(id);
        if (!promotion) {
            throw new app_errol_1.NotFoundException("Promotion not found");
        }
        const { title, description, banner_url, banner_id, start_date, end_date, is_active, priority, discount_type, discount_value, max_discount, min_order, } = payload;
        if (payload.title !== undefined) {
            promotion.title = payload.title.trim();
        }
        if (payload.description !== undefined) {
            promotion.description = payload.description ?? null;
        }
        if (payload.banner_url !== undefined) {
            promotion.banner_url = payload.banner_url ?? null;
        }
        if (banner_url !== undefined && banner_id !== undefined) {
            if (promotion.banner_id && promotion.banner_id !== banner_id) {
                try {
                    await cloudinary_1.cloudinaryClient.uploader.destroy(promotion.banner_id);
                }
                catch (e) {
                    console.error("Failed to delete old promotion banner:", e);
                }
            }
            promotion.banner_url = banner_url ?? null;
            promotion.banner_id = banner_id ?? null;
        }
        if (payload.start_date !== undefined) {
            const d = new Date(payload.start_date);
            if (isNaN(d.getTime()))
                throw new app_errol_1.BadRequestException("Invalid start_date");
            promotion.start_date = d;
        }
        if (payload.end_date !== undefined) {
            const d = new Date(payload.end_date);
            if (isNaN(d.getTime()))
                throw new app_errol_1.BadRequestException("Invalid end_date");
            if (d < promotion.start_date) {
                throw new app_errol_1.BadRequestException("end_date must be >= start_date");
            }
            promotion.end_date = d;
        }
        if (payload.priority !== undefined) {
            promotion.priority = payload.priority;
        }
        // =========================
        // 1) Validate discount fields nếu bạn muốn (optional)
        // =========================
        if (discount_type !== undefined) {
            promotion.discount_type = discount_type;
        }
        if (discount_value !== undefined) {
            promotion.discount_value = discount_value;
        }
        if (max_discount !== undefined) {
            promotion.max_discount = max_discount ?? null;
        }
        if (min_order !== undefined) {
            promotion.min_order = min_order ?? null;
        }
        // =========================
        // 2) CHECK: không cho bật nếu chưa link coupon/brand/product
        // =========================
        if (typeof payload.is_active === "boolean") {
            // chỉ check khi chuyển từ false -> true
            const wantActive = payload.is_active === true;
            const currentlyInactive = promotion.is_active === false;
            if (wantActive && currentlyInactive) {
                const [couponCount, brandCount, productCount] = await Promise.all([
                    promotion_coupon_model_1.PromotionCoupon.countDocuments({ promotion_id: promotion._id }),
                    promotion_brand_model_1.PromotionBrand.countDocuments({ promotion_id: promotion._id }),
                    promotion_product_model_1.PromotionProduct.countDocuments({ promotion_id: promotion._id }),
                ]);
                if (couponCount + brandCount + productCount === 0) {
                    throw new app_errol_1.BadRequestException("Không thể bật khuyến mãi khi chưa áp dụng cho coupon, thương hiệu hoặc sản phẩm nào.");
                }
            }
            promotion.is_active = payload.is_active;
        }
        await promotion.save();
        return promotion.toObject();
    },
    // ========== REMOVE ==========
    async remove(id, opts) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const promotion = await promotion_model_1.Promotion.findById(id);
        if (!promotion) {
            throw new app_errol_1.NotFoundException("Promotion not found");
        }
        // ----- XÓA CỨNG -----
        if (opts?.force) {
            // Nếu có banner thì xoá luôn trên Cloudinary
            if (promotion.banner_id) {
                try {
                    await cloudinary_1.cloudinaryClient.uploader.destroy(promotion.banner_id);
                }
                catch (e) {
                    console.error("Failed to delete promotion banner:", e);
                }
            }
            // Xoá mọi liên kết
            await Promise.all([
                promotion_coupon_model_1.PromotionCoupon.deleteMany({ promotion_id: promotion._id }),
                promotion_brand_model_1.PromotionBrand.deleteMany({ promotion_id: promotion._id }),
                promotion_product_model_1.PromotionProduct.deleteMany({ promotion_id: promotion._id }),
                promotion_model_1.Promotion.deleteOne({ _id: promotion._id }),
            ]);
            return { success: true, force: true };
        }
        // ----- SOFT DELETE (MẶC ĐỊNH) -----
        promotion.is_active = false;
        await promotion.save();
        return { success: true, force: false };
    },
    async linkBrand(promoId, brandId) {
        const promotion = await this._ensurePromotion(promoId);
        const brand = await this._ensureBrand(brandId);
        // ❗ Check: nếu đã có brand nào gắn với promotion này rồi => không cho gắn thêm
        const existing = await promotion_brand_model_1.PromotionBrand.findOne({
            promotion_id: promotion._id,
        }).lean();
        if (existing) {
            // nếu trùng cùng brand thì coi như ok, không lỗi
            if (String(existing.brand_id) === String(brand._id)) {
                return { success: true, message: "Brand đã được gắn từ trước" };
            }
            throw new app_errol_1.BadRequestException("Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 thương hiệu. Vui lòng gỡ thương hiệu cũ trước.");
        }
        try {
            await promotion_brand_model_1.PromotionBrand.create({
                promotion_id: promotion._id,
                brand_id: brand._id,
            });
        }
        catch (err) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new app_errol_1.default(err.message || "Cannot link brand", 500);
        }
        return { success: true };
    },
    async linkCoupon(promoId, couponId) {
        const promotion = await this._ensurePromotion(promoId);
        const coupon = await this._ensureCoupon(couponId);
        const existing = await promotion_coupon_model_1.PromotionCoupon.findOne({
            promotion_id: promotion._id,
        }).lean();
        if (existing) {
            if (String(existing.coupon_id) === String(coupon._id)) {
                return { success: true, message: "Coupon đã được gắn từ trước" };
            }
            throw new app_errol_1.BadRequestException("Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 coupon. Vui lòng gỡ coupon cũ trước.");
        }
        try {
            await promotion_coupon_model_1.PromotionCoupon.create({
                promotion_id: promotion._id,
                coupon_id: coupon._id,
            });
        }
        catch (err) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new app_errol_1.default(err.message || "Cannot link coupon", 500);
        }
        return { success: true };
    },
    async linkProduct(promoId, productId) {
        const promotion = await this._ensurePromotion(promoId);
        const product = await this._ensureProduct(productId);
        const existing = await promotion_product_model_1.PromotionProduct.findOne({
            promotion_id: promotion._id,
        }).lean();
        if (existing) {
            if (String(existing.product_id) === String(product._id)) {
                return { success: true, message: "Product đã được gắn từ trước" };
            }
            throw new app_errol_1.BadRequestException("Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 sản phẩm. Vui lòng gỡ sản phẩm cũ trước.");
        }
        try {
            await promotion_product_model_1.PromotionProduct.create({
                promotion_id: promotion._id,
                product_id: product._id,
            });
        }
        catch (err) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new app_errol_1.default(err.message || "Cannot link product", 500);
        }
        return { success: true };
    },
    async unlinkCoupon(promoId, couponId) {
        const promotion = await this._ensurePromotion(promoId);
        const coupon = await this._ensureCoupon(couponId);
        await promotion_coupon_model_1.PromotionCoupon.deleteOne({
            promotion_id: promotion._id,
            coupon_id: coupon._id,
        });
        return { success: true };
    },
    async unlinkBrand(promoId, brandId) {
        const promotion = await this._ensurePromotion(promoId);
        const brand = await this._ensureBrand(brandId);
        await promotion_brand_model_1.PromotionBrand.deleteOne({
            promotion_id: promotion._id,
            brand_id: brand._id,
        });
        return { success: true };
    },
    async unlinkProduct(promoId, productId) {
        const promotion = await this._ensurePromotion(promoId);
        const product = await this._ensureProduct(productId);
        await promotion_product_model_1.PromotionProduct.deleteOne({
            promotion_id: promotion._id,
            product_id: product._id,
        });
        return { success: true };
    },
    // ========== PRIVATE HELPERS ==========
    async _ensurePromotion(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid promotion id");
        }
        const promo = await promotion_model_1.Promotion.findById(id);
        if (!promo)
            throw new app_errol_1.NotFoundException("Promotion not found");
        return promo;
    },
    async _ensureCoupon(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid coupon id");
        }
        const coupon = await coupons_model_1.Coupon.findById(id);
        if (!coupon)
            throw new app_errol_1.NotFoundException("Coupon not found");
        return coupon;
    },
    async _ensureBrand(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid brand id");
        }
        const brand = await brands_model_1.Brand.findById(id);
        if (!brand)
            throw new app_errol_1.NotFoundException("Brand not found");
        return brand;
    },
    async _ensureProduct(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid product id");
        }
        const product = await products_model_1.Product.findById(id);
        if (!product)
            throw new app_errol_1.NotFoundException("Product not found");
        return product;
    },
    async getRelations(promoId) {
        if (!mongoose_1.Types.ObjectId.isValid(promoId)) {
            throw new app_errol_1.BadRequestException("Invalid promotion id");
        }
        const promotion = await promotion_model_1.Promotion.findById(promoId).lean();
        if (!promotion) {
            throw new app_errol_1.NotFoundException("Promotion not found");
        }
        const [couponLinks, brandLinks, productLinks] = await Promise.all([
            promotion_coupon_model_1.PromotionCoupon.find({ promotion_id: promoId })
                .populate("coupon_id")
                .lean(),
            promotion_brand_model_1.PromotionBrand.find({ promotion_id: promoId })
                .populate("brand_id")
                .lean(),
            promotion_product_model_1.PromotionProduct.find({ promotion_id: promoId })
                .populate("product_id")
                .lean(),
        ]);
        const coupons = couponLinks
            .map((link) => link.coupon_id)
            .filter(Boolean);
        const brands = brandLinks
            .map((link) => link.brand_id)
            .filter(Boolean);
        const products = productLinks
            .map((link) => link.product_id)
            .filter(Boolean);
        return {
            promotion,
            coupons,
            brands,
            products,
        };
    },
};
