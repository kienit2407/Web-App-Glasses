import { Types } from "mongoose";
import { Promotion, IPromotion } from "../../../models/promotion.model";
import { PromotionCoupon } from "../../../models/promotion.coupon.model";
import { PromotionBrand } from "../../../models/promotion.brand.model";
import { PromotionProduct } from "../../../models/promotion.product.model";
import { Coupon } from "../../../models/coupons.model";
import { Brand } from "../../../models/brands.model";
import { Product } from "../../../models/products.model";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";
import { cloudinaryClient } from "../../../config/cloudinary";

interface ListPromotionsParams {
    page?: number;
    limit?: number;
    title?: string;
    is_active?: boolean;
    from_date?: string;
    to_date?: string;
}

interface CreatePromotionPayload {
    title: string;
    description?: string | null;
    banner_url?: string | null;
    banner_id?: string | null;
    start_date: string | Date;
    end_date: string | Date;
    is_active?: boolean;
    priority?: number;

    
    discount_type: "percent" | "fixed";
    discount_value: number;
    max_discount?: number | null;   // optional nếu bạn có
    min_order?: number | null;      // optional nếu bạn có
}

interface UpdatePromotionPayload {
    title?: string;
    description?: string | null;
    banner_url?: string | null;
    banner_id?: string | null;
    start_date?: string | Date;
    end_date?: string | Date;
    is_active?: boolean;
    priority?: number;

    
    discount_type?: "percent" | "fixed";
    discount_value?: number;
    max_discount?: number | null;
    min_order?: number | null;
}

export const adminPromotionService = {
    // ========== LIST ==========
    async list(params: ListPromotionsParams) {
        const {
            page = 1,
            limit = 20,
            title,
            is_active,
            from_date,
            to_date,
        } = params;

        const filter: any = {};

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
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid from_date");
                filter.start_date.$gte = d;
            }
            if (to_date) {
                const d = new Date(to_date);
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid to_date");
                filter.start_date.$lte = d;
            }
        }

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Promotion.find(filter)
                .sort({ priority: -1, start_date: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Promotion.countDocuments(filter),
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
    async create(payload: CreatePromotionPayload) {
        let {
            title,
            description,
            banner_url,
            banner_id,
            start_date,
            end_date,
            is_active,
            priority,
            discount_type,
            discount_value,
            max_discount,
            min_order,

        } = payload;

        if (!title || !start_date || !end_date) {
            throw new BadRequestException("title, start_date, end_date are required");
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (isNaN(start.getTime())) throw new BadRequestException("Invalid start_date");
        if (isNaN(end.getTime())) throw new BadRequestException("Invalid end_date");
        if (end < start) {
            throw new BadRequestException("end_date must be >= start_date");
        }

        const promotion = await Promotion.create({
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
    async update(id: string, payload: UpdatePromotionPayload) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const promotion = await Promotion.findById(id);
        if (!promotion) {
            throw new NotFoundException("Promotion not found");
        }

        const {
            title,
            description,
            banner_url,
            banner_id,
            start_date,
            end_date,
            is_active,
            priority,

            discount_type,
            discount_value,
            max_discount,
            min_order,
        } = payload;

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
                    await cloudinaryClient.uploader.destroy(promotion.banner_id);
                } catch (e) {
                    console.error("Failed to delete old promotion banner:", e);
                }
            }

            promotion.banner_url = banner_url ?? null;
            promotion.banner_id = banner_id ?? null;
        }

        if (payload.start_date !== undefined) {
            const d = new Date(payload.start_date);
            if (isNaN(d.getTime())) throw new BadRequestException("Invalid start_date");
            promotion.start_date = d;
        }

        if (payload.end_date !== undefined) {
            const d = new Date(payload.end_date);
            if (isNaN(d.getTime())) throw new BadRequestException("Invalid end_date");
            if (d < promotion.start_date) {
                throw new BadRequestException("end_date must be >= start_date");
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
                    PromotionCoupon.countDocuments({ promotion_id: promotion._id }),
                    PromotionBrand.countDocuments({ promotion_id: promotion._id }),
                    PromotionProduct.countDocuments({ promotion_id: promotion._id }),
                ]);

                if (couponCount + brandCount + productCount === 0) {
                    throw new BadRequestException(
                        "Không thể bật khuyến mãi khi chưa áp dụng cho coupon, thương hiệu hoặc sản phẩm nào."
                    );
                }
            }

            promotion.is_active = payload.is_active;
        }

        await promotion.save();
        return promotion.toObject();
    },

    // ========== REMOVE ==========
    async remove(id: string, opts?: { force?: boolean }) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const promotion = await Promotion.findById(id);
        if (!promotion) {
            throw new NotFoundException("Promotion not found");
        }

        // ----- XÓA CỨNG -----
        if (opts?.force) {
            // Nếu có banner thì xoá luôn trên Cloudinary
            if (promotion.banner_id) {
                try {
                    await cloudinaryClient.uploader.destroy(promotion.banner_id);
                } catch (e) {
                    console.error("Failed to delete promotion banner:", e);
                }
            }

            // Xoá mọi liên kết
            await Promise.all([
                PromotionCoupon.deleteMany({ promotion_id: promotion._id }),
                PromotionBrand.deleteMany({ promotion_id: promotion._id }),
                PromotionProduct.deleteMany({ promotion_id: promotion._id }),
                Promotion.deleteOne({ _id: promotion._id }),
            ]);

            return { success: true, force: true };
        }

        // ----- SOFT DELETE (MẶC ĐỊNH) -----
        promotion.is_active = false;
        await promotion.save();

        return { success: true, force: false };
    },

    async linkBrand(promoId: string, brandId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const brand = await this._ensureBrand(brandId);

        // ❗ Check: nếu đã có brand nào gắn với promotion này rồi => không cho gắn thêm
        const existing = await PromotionBrand.findOne({
            promotion_id: promotion._id,
        }).lean();

        if (existing) {
            // nếu trùng cùng brand thì coi như ok, không lỗi
            if (String(existing.brand_id) === String(brand._id)) {
                return { success: true, message: "Brand đã được gắn từ trước" };
            }
            throw new BadRequestException(
                "Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 thương hiệu. Vui lòng gỡ thương hiệu cũ trước."
            );
        }

        try {
            await PromotionBrand.create({
                promotion_id: promotion._id,
                brand_id: brand._id,
            });
        } catch (err: any) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new AppError(err.message || "Cannot link brand", 500);
        }

        return { success: true };
    },

    async linkCoupon(promoId: string, couponId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const coupon = await this._ensureCoupon(couponId);

        const existing = await PromotionCoupon.findOne({
            promotion_id: promotion._id,
        }).lean();

        if (existing) {
            if (String(existing.coupon_id) === String(coupon._id)) {
                return { success: true, message: "Coupon đã được gắn từ trước" };
            }
            throw new BadRequestException(
                "Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 coupon. Vui lòng gỡ coupon cũ trước."
            );
        }

        try {
            await PromotionCoupon.create({
                promotion_id: promotion._id,
                coupon_id: coupon._id,
            });
        } catch (err: any) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new AppError(err.message || "Cannot link coupon", 500);
        }

        return { success: true };
    },

    async linkProduct(promoId: string, productId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const product = await this._ensureProduct(productId);

        const existing = await PromotionProduct.findOne({
            promotion_id: promotion._id,
        }).lean();

        if (existing) {
            if (String(existing.product_id) === String(product._id)) {
                return { success: true, message: "Product đã được gắn từ trước" };
            }
            throw new BadRequestException(
                "Mỗi khuyến mãi chỉ được áp dụng cho tối đa 1 sản phẩm. Vui lòng gỡ sản phẩm cũ trước."
            );
        }

        try {
            await PromotionProduct.create({
                promotion_id: promotion._id,
                product_id: product._id,
            });
        } catch (err: any) {
            if (err.code === 11000) {
                return { success: true, message: "Already linked" };
            }
            throw new AppError(err.message || "Cannot link product", 500);
        }

        return { success: true };
    },

    async unlinkCoupon(promoId: string, couponId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const coupon = await this._ensureCoupon(couponId);

        await PromotionCoupon.deleteOne({
            promotion_id: promotion._id,
            coupon_id: coupon._id,
        });

        return { success: true };
    },



    async unlinkBrand(promoId: string, brandId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const brand = await this._ensureBrand(brandId);

        await PromotionBrand.deleteOne({
            promotion_id: promotion._id,
            brand_id: brand._id,
        });

        return { success: true };
    },



    async unlinkProduct(promoId: string, productId: string) {
        const promotion = await this._ensurePromotion(promoId);
        const product = await this._ensureProduct(productId);

        await PromotionProduct.deleteOne({
            promotion_id: promotion._id,
            product_id: product._id,
        });

        return { success: true };
    },

    // ========== PRIVATE HELPERS ==========
    async _ensurePromotion(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid promotion id");
        }
        const promo = await Promotion.findById(id);
        if (!promo) throw new NotFoundException("Promotion not found");
        return promo;
    },

    async _ensureCoupon(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid coupon id");
        }
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new NotFoundException("Coupon not found");
        return coupon;
    },

    async _ensureBrand(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid brand id");
        }
        const brand = await Brand.findById(id);
        if (!brand) throw new NotFoundException("Brand not found");
        return brand;
    },

    async _ensureProduct(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid product id");
        }
        const product = await Product.findById(id);
        if (!product) throw new NotFoundException("Product not found");
        return product;
    },
    async getRelations(promoId: string) {
        if (!Types.ObjectId.isValid(promoId)) {
            throw new BadRequestException("Invalid promotion id");
        }

        const promotion = await Promotion.findById(promoId).lean();
        if (!promotion) {
            throw new NotFoundException("Promotion not found");
        }

        const [couponLinks, brandLinks, productLinks] = await Promise.all([
            PromotionCoupon.find({ promotion_id: promoId })
                .populate("coupon_id")
                .lean(),
            PromotionBrand.find({ promotion_id: promoId })
                .populate("brand_id")
                .lean(),
            PromotionProduct.find({ promotion_id: promoId })
                .populate("product_id")
                .lean(),
        ]);

        const coupons = couponLinks
            .map((link: any) => link.coupon_id)
            .filter(Boolean);

        const brands = brandLinks
            .map((link: any) => link.brand_id)
            .filter(Boolean);

        const products = productLinks
            .map((link: any) => link.product_id)
            .filter(Boolean);

        return {
            promotion,
            coupons,
            brands,
            products,
        };
    },
};
