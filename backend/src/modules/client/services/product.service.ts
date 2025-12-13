// src/service/product.service.ts
import { Types } from "mongoose";
import { Product } from "../../../models/products.model";
import { GetProductsQuery } from "../../../types/product";
import { ProductVariant } from "../../../models/product.variants.model";
import { ProductImage } from "../../../models/products.image.model";
import { Brand } from "../../../models/brands.model";
function escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
type GenderPref = "male" | "female" | "kids";
type FaceShape = "round" | "square" | "oval" | "heart" | "diamond";
type RecommendProductItem = {
    product_id: string;
    product_name: string;
    slug: string;
    price: number;
    thumbnail_url: string | null;
    for_gender?: "male" | "female" | "unisex" | "kids";
    has_uv_protection?: boolean;
    frame_shapes?: string[]; // từ variants
}
const FACE_SHAPE_TO_FRAME_SHAPES: Record<FaceShape, string[]> = {
    round: ["square", "rectangle", "polygon", "browline"],
    square: ["round", "oval", "cat-eye"],
    oval: ["square", "rectangle", "round", "pilot", "browline"],
    heart: ["round", "oval", "cat-eye"],
    diamond: ["round", "oval", "cat-eye"],
};
function removeVietnameseTones(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // bỏ các dấu thanh
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}
export const productService = {

    async getPublicProducts(query: GetProductsQuery) {
        const {
            q,
            categories,
            brands,
            minPrice,
            maxPrice,
            sort = "newest",
            page = 1,
            limit = 20,
            gender,
            shape,
        } = query;

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        // ----- MATCH CƠ BẢN (PRODUCT LEVEL) -----
        const matchStage: any = {
            is_active: true,
        };

        // Search theo tên / tags
        if (q) {
            const regex = new RegExp(q, "i");
            matchStage.$or = [{ product_name: regex }, { tags: regex }];
        }

        // Category filter
        if (categories && categories.length > 0) {
            matchStage.category_id = {
                $in: categories.map((id) => new Types.ObjectId(id)),
            };
        }

        // Brand filter
        if (brands && brands.length > 0) {
            matchStage.brand_id = {
                $in: brands.map((id) => new Types.ObjectId(id)),
            };
        }

        // Gender filter -> map với for_gender
        if (gender) {
            matchStage.for_gender = gender;
        }

        // ----- PIPELINE -----
        const pipeline: any[] = [
            { $match: matchStage },

            // Join variants với pipeline để filter is_active + shape
            {
                $lookup: {
                    from: "product_variants",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$product_id", "$$productId"] },
                                is_active: true,
                                ...(shape ? { frame_shape: shape } : {}),
                            },
                        },
                    ],
                    as: "variants",
                },
            },

            // Chỉ giữ product còn ít nhất 1 variant phù hợp
            {
                $match: {
                    "variants.0": { $exists: true },
                },
            },

            // Tính:
            // - price: giá thấp nhất (ưu tiên sale_price, fallback price)
            // - total_stock: tổng stock
            // - discount_percent: % giảm cao nhất trong các variant
            {
                $addFields: {
                    // giá thấp nhất sau khuyến mãi
                    price: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: {
                                    $ifNull: ["$$v.sale_price", "$$v.price"],
                                },
                            },
                        },
                    },

                    // tổng stock
                    total_stock: {
                        $sum: "$variants.stock",
                    },

                    // % giảm cao nhất
                    discount_percent: {
                        $max: {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ifNull: ["$$v.sale_price", false] },
                                                { $gt: ["$$v.price", 0] },
                                            ],
                                        },
                                        {
                                            $round: [
                                                {
                                                    $multiply: [
                                                        {
                                                            $divide: [
                                                                { $subtract: ["$$v.price", "$$v.sale_price"] },
                                                                "$$v.price",
                                                            ],
                                                        },
                                                        100,
                                                    ],
                                                },
                                                0,
                                            ],
                                        },
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        ];

        // Price filter dựa trên price (giá thấp nhất sau giảm)
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceCond: any = {};
            if (minPrice !== undefined) priceCond.$gte = minPrice;
            if (maxPrice !== undefined) priceCond.$lte = maxPrice;

            pipeline.push({
                $match: {
                    price: priceCond,
                },
            });
        }

        // Sort
        const sortStage: any = {};
        switch (sort) {
            case "price_asc":
                sortStage.price = 1;
                break;
            case "price_desc":
                sortStage.price = -1;
                break;
            case "rating":
                sortStage.review_count = -1; // sau này có rating_avg thì đổi
                break;
            case "most_sold":
                sortStage.selled_amount = -1;
                break;
            case "newest":
            default:
                sortStage.createdAt = -1;
                break;
        }
        pipeline.push({ $sort: sortStage });

        // Lookup brand để lấy tên & logo
        pipeline.push(
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand",
                },
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true,
                },
            }
        );

        // Phân trang + tổng
        pipeline.push(
            {
                $facet: {
                    items: [{ $skip: skip }, { $limit: limitNum }],
                    total: [{ $count: "count" }],
                },
            },
            {
                $project: {
                    items: 1,
                    total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
                },
            }
        );

        const [result] = await Product.aggregate(pipeline)
        const items = result.items.map((p: any) => ({
            product_id: p._id,
            product_name: p.product_name,
            slug: p.slug,

            // thumbnail
            thumbnail_url: p.thumbnail_url || null,

            // thống kê
            selled_amount: p.selled_amount ?? 0,
            review_count: p.review_count ?? 0,
            rating_avg: p.rating_avg ?? 0,

            // giá hiển thị (thấp nhất sau giảm)
            price: p.price,

            // tồn kho tổng
            total_stock: p.total_stock ?? 0,

            // % giảm cao nhất (0 nếu không có giảm)
            discount_percent: p.discount_percent ?? 0,

            // brand info
            brand_id: p.brand_id,
            brand_name: p.brand?.brand_name ?? null,
            brand_logo_url: p.brand?.logo_url ?? null,

            category_id: p.category_id,
            createdAt: p.createdAt,
        }));

        return {
            items,
            total: result.total as number,
            page: pageNum,
            limit: limitNum,
        };
    },
    async getSearchSuggestions(rawQ: string, limit = 10) {
        const q = rawQ.trim();
        if (!q) {
            return { keywords: [], products: [], brands: [] };
        }

        const normQ = removeVietnameseTones(q.toLowerCase());

        // lấy tạm 300 sp, ưu tiên bán nhiều / review nhiều
        const products = await Product.find({ is_active: true })
            .sort({ selled_amount: -1, review_count: -1 })
            .limit(300)
            .select("product_name slug tags");

        const matchedProducts = products.filter((p) => {
            const name = p.product_name ?? "";
            const tags = Array.isArray(p.tags) ? p.tags.join(" ") : "";

            const haystack = (name + " " + tags).toLowerCase();
            const haystackNorm = removeVietnameseTones(haystack);

            return haystackNorm.includes(normQ);
        });

        // sinh keywords từ matchedProducts
        const keywordSet = new Set<string>();
        for (const p of matchedProducts) {
            if (p.product_name) keywordSet.add(p.product_name);
            if (Array.isArray(p.tags)) {
                for (const t of p.tags) {
                    if (typeof t === "string") {
                        const tNorm = removeVietnameseTones(t.toLowerCase());
                        if (tNorm.includes(normQ)) keywordSet.add(t);
                    }
                }
            }
        }

        const keywords = Array.from(keywordSet).slice(0, limit);
        const productItems = matchedProducts.slice(0, limit).map((p) => ({
            product_id: p._id,
            product_name: p.product_name,
            slug: p.slug,
        }));

        // brand cũng làm tương tự nếu muốn
        const brands = await Brand.find({ is_active: true })
            .limit(100)
            .select("brand_name logo_url");

        const matchedBrands = brands.filter((b) => {
            const normName = removeVietnameseTones(b.brand_name.toLowerCase());
            return normName.includes(normQ);
        });

        const brandItems = matchedBrands.slice(0, 5).map((b) => ({
            brand_id: b._id,
            brand_name: b.brand_name,
            logo_url: b.logo_url ?? null,
        }));

        return {
            keywords,
            products: productItems,
            brands: brandItems,
        };
    },

    async getProductDetail(productId: string) {
        if (!Types.ObjectId.isValid(productId)) return null;

        // Lấy thông tin sản phẩm chính
        const product = await Product.findOne({
            _id: productId,
            is_active: true,
        }).lean();

        if (!product) return null;

        // Lấy thông tin variants và images của sản phẩm
        const [variants, images] = await Promise.all([
            ProductVariant.find({
                product_id: product._id,
                is_active: true,
            }).sort({ createdAt: 1 }).lean(),
            ProductImage.find({
                product_id: product._id,
            }).sort({ position: 1 }).lean(),
        ]);

        // Các ảnh sản phẩm chính
        const productImages = images.filter((img) => !img.variant_id).map((img) => ({
            image_id: img._id,
            url: img.url,
            url_id: img.url_id,
            position: img.position,
        }));

        // Các ảnh riêng biệt cho từng variant
        const byVariant: Record<string, any[]> = {};
        images.filter((img) => img.variant_id).forEach((img) => {
            const vid = String(img.variant_id);
            if (!byVariant[vid]) byVariant[vid] = [];
            byVariant[vid].push({
                image_id: img._id,
                url: img.url,
                url_id: img.url_id,
                position: img.position,
            });
        });

        // Trả về thông tin chi tiết sản phẩm
        return {
            product: {
                product_id: product._id,
                product_name: product.product_name,
                slug: product.slug,
                description: product.description,
                selled_amount: product.selled_amount ?? 0,
                review_count: product.review_count ?? 0,
                rating_avg: product.rating_avg ?? 0,  // Trả về rating_avg từ sản phẩm chính
                origin_country: product.origin_country,
                category_id: product.category_id,
                brand_id: product.brand_id,
                tags: product.tags ?? [],
                thumbnail_url: product.thumbnail_url ?? null,
                thumbnail_id: product.thumbnail_id ?? null,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
            variants: variants.map((v) => ({
                variant_id: v._id,
                sku_variant: v.sku_variant,
                frame_material: v.frame_material,
                frame_color: v.frame_color,
                frame_shape: v.frame_shape,
                lens_width: v.lens_width,
                lens_height: v.lens_height,
                temple_length: v.temple_length,
                bridge_width: v.bridge_width,
                stock: v.stock,
                has_uv_protection: v.has_uv_protection,
                price: v.price,
                sale_price: v.sale_price,
                is_active: v.is_active,
            })),
            images: {
                product: productImages, // ảnh chung cho sản phẩm
                byVariant,              // ảnh riêng cho từng variant
            },
        };
    },
    async getFaceShapeRecommendations(params: {
        faceShape: FaceShape;
        maxBudget?: number;
        limit?: number;
    }) {
        const { faceShape, maxBudget, limit = 6 } = params;
        const allowedShapes = FACE_SHAPE_TO_FRAME_SHAPES[faceShape] ?? [];

        const pipeline: any[] = [
            { $match: { is_active: true } },
            {
                $lookup: {
                    from: "product_variants",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$product_id", "$$productId"] },
                                is_active: true,
                                ...(allowedShapes.length
                                    ? { frame_shape: { $in: allowedShapes } }
                                    : {}),
                            },
                        },
                    ],
                    as: "variants",
                },
            },
            { $match: { "variants.0": { $exists: true } } },
            {
                $addFields: {
                    price: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: {
                                    $ifNull: ["$$v.sale_price", "$$v.price"],
                                },
                            },
                        },
                    },
                },
            },
        ];

        if (typeof maxBudget === "number") {
            pipeline.push({
                $match: { price: { $lte: maxBudget } },
            });
        }

        pipeline.push(
            { $sort: { selled_amount: -1, createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand",
                },
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true,
                },
            }
        );

        const docs = await Product.aggregate(pipeline);

        const items = docs.map((p: any) => ({
            product_id: p._id,
            product_name: p.product_name,
            slug: p.slug,
            price: p.price,
            thumbnail_url: p.thumbnail_url ?? null,
            brand_name: p.brand?.brand_name ?? null,
        }));

        return { items };
    },
    async getBudgetRecommendations(params: {
        maxBudget?: number;
        limit?: number;
    }): Promise<{ items: RecommendProductItem[] }> {
        const { maxBudget, limit = 6 } = params;

        const pipeline: any[] = [
            { $match: { is_active: true } },
            {
                $lookup: {
                    from: "product_variants",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$product_id", "$$productId"] },
                                is_active: true,
                            },
                        },
                    ],
                    as: "variants",
                },
            },
            { $match: { "variants.0": { $exists: true } } },
            {
                $addFields: {
                    price: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: { $ifNull: ["$$v.sale_price", "$$v.price"] },
                            },
                        },
                    },
                },
            },
        ];

        if (typeof maxBudget === "number") {
            pipeline.push({ $match: { price: { $lte: maxBudget } } });
        }

        pipeline.push(
            { $sort: { selled_amount: -1, createdAt: -1 } },
            { $limit: limit }
        );

        const docs = await Product.aggregate(pipeline);

        const items: RecommendProductItem[] = docs.map((p: any) => ({
            product_id: String(p._id),
            product_name: p.product_name,
            slug: p.slug,
            price: p.price,
            thumbnail_url: p.thumbnail_url ?? null,
        }));
        console.log("[getBudgetRecommendations] maxBudget =", maxBudget);
        console.log("docs count =", docs.length);
        return { items };
    },
    async getContextRecommendations(params: {
        keywordContext: 'sunglasses' | 'frame'; // Kính mát hoặc gọng
        maxBudget?: number;
        limit?: number;
        genderPref?: GenderPref; // NEW
    }): Promise<{ items: RecommendProductItem[] }> {
        const { keywordContext, maxBudget, limit = 6, genderPref } = params;

        // match cơ bản
        const matchStage: any = {
            is_active: true,
        };

        // NEW: filter theo giới tính nếu có
        if (genderPref === "male") {
            matchStage.for_gender = { $in: ["male", "unisex"] };
        } else if (genderPref === "female") {
            matchStage.for_gender = { $in: ["female", "unisex"] };
        } else if (genderPref === "kids") {
            matchStage.for_gender = "kids";
        }

        const pipeline: any[] = [
            { $match: matchStage },

            // 1. Lọc theo loại sản phẩm (tên có "kính mát/kính râm" hoặc "gọng")
            {
                $match: {
                    product_name: {
                        $regex: keywordContext === "sunglasses"
                            ? /kính mát|kính râm/i
                            : /gọng/i,
                    },
                },
            },

            // 2. Lookup variants để tính giá như getBudgetRecommendations
            {
                $lookup: {
                    from: "product_variants",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$product_id", "$$productId"] },
                                is_active: true,
                            },
                        },
                    ],
                    as: "variants",
                },
            },
            { $match: { "variants.0": { $exists: true } } },
            {
                $addFields: {
                    price: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: { $ifNull: ["$$v.sale_price", "$$v.price"] },
                            },
                        },
                    },
                },
            },
        ];

        if (typeof maxBudget === "number") {
            pipeline.push({ $match: { price: { $lte: maxBudget } } });
        }

        pipeline.push(
            { $sort: { selled_amount: -1, createdAt: -1 } }, // Ưu tiên bán chạy
            { $limit: limit },
        );

        const docs = await Product.aggregate(pipeline);

        const items: RecommendProductItem[] = docs.map((p: any) => ({
            product_id: String(p._id),
            product_name: p.product_name,
            slug: p.slug,
            price: p.price,
            thumbnail_url: p.thumbnail_url ?? null,
            for_gender: p.for_gender,
            has_uv_protection: p.has_uv_protection,
            frame_shapes: p.frame_shapes ?? [],
        }));

        return { items };
    },
    async findProductByNameApprox(raw: string) {
        const trimmed = raw.trim();
        if (!trimmed) return null;

        const regex = new RegExp(escapeRegex(trimmed), "i");
        const product = await Product.findOne({
            is_active: true,
            product_name: regex,
        }).lean();

        return product;
    }
};
