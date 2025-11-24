"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
// src/service/product.service.ts
const mongoose_1 = require("mongoose");
const products_model_1 = require("../../../models/products.model");
const product_variants_model_1 = require("../../../models/product.variants.model");
const products_image_model_1 = require("../../../models/products.image.model");
exports.productService = {
    async getPublicProducts(query) {
        const { q, categories, brands, minPrice, maxPrice, sort = "newest", page = 1, limit = 20, gender, shape, } = query;
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;
        // ----- MATCH CƠ BẢN (PRODUCT LEVEL) -----
        const matchStage = {
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
                $in: categories.map((id) => new mongoose_1.Types.ObjectId(id)),
            };
        }
        // Brand filter
        if (brands && brands.length > 0) {
            matchStage.brand_id = {
                $in: brands.map((id) => new mongoose_1.Types.ObjectId(id)),
            };
        }
        // Gender filter -> map với for_gender
        if (gender) {
            matchStage.for_gender = gender;
        }
        // ----- PIPELINE -----
        const pipeline = [
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
            const priceCond = {};
            if (minPrice !== undefined)
                priceCond.$gte = minPrice;
            if (maxPrice !== undefined)
                priceCond.$lte = maxPrice;
            pipeline.push({
                $match: {
                    price: priceCond,
                },
            });
        }
        // Sort
        const sortStage = {};
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
        pipeline.push({
            $lookup: {
                from: "brands",
                localField: "brand_id",
                foreignField: "_id",
                as: "brand",
            },
        }, {
            $unwind: {
                path: "$brand",
                preserveNullAndEmptyArrays: true,
            },
        });
        // Phân trang + tổng
        pipeline.push({
            $facet: {
                items: [{ $skip: skip }, { $limit: limitNum }],
                total: [{ $count: "count" }],
            },
        }, {
            $project: {
                items: 1,
                total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
            },
        });
        const [result] = await products_model_1.Product.aggregate(pipeline);
        const items = result.items.map((p) => ({
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
            total: result.total,
            page: pageNum,
            limit: limitNum,
        };
    },
    async getProductDetail(productId) {
        if (!mongoose_1.Types.ObjectId.isValid(productId))
            return null;
        const product = await products_model_1.Product.findOne({
            _id: productId,
            is_active: true,
        }).lean();
        if (!product)
            return null;
        const [variants, images] = await Promise.all([
            product_variants_model_1.ProductVariant.find({
                product_id: product._id,
                is_active: true,
            })
                .sort({ createdAt: 1 })
                .lean(),
            products_image_model_1.ProductImage.find({
                product_id: product._id,
            })
                .sort({ position: 1 })
                .lean(),
        ]);
        const productImages = images
            .filter((img) => !img.variant_id)
            .map((img) => ({
            image_id: img._id,
            url: img.url,
            url_id: img.url_id,
            position: img.position,
        }));
        const byVariant = {};
        images
            .filter((img) => img.variant_id)
            .forEach((img) => {
            const vid = String(img.variant_id);
            if (!byVariant[vid])
                byVariant[vid] = [];
            byVariant[vid].push({
                image_id: img._id,
                url: img.url,
                url_id: img.url_id,
                position: img.position,
            });
        });
        return {
            product: {
                product_id: product._id,
                product_name: product.product_name,
                slug: product.slug, // FE dùng để hiển thị URL đẹp
                description: product.description,
                selled_amount: product.selled_amount ?? 0,
                review_count: product.review_count ?? 0,
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
                rating_avg: product.rating_avg ?? 0,
                has_uv_protection: v.has_uv_protection,
                price: v.price,
                sale_price: v.sale_price,
                is_active: v.is_active,
            })),
            images: {
                product: productImages, // ảnh chung
                byVariant, // ảnh riêng từng variant
            },
        };
    },
};
