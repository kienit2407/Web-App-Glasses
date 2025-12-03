"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
// src/service/review.service.ts
const mongoose_1 = require("mongoose");
const reviews_model_1 = require("../../../models/reviews.model");
const products_model_1 = require("../../../models/products.model");
exports.reviewService = {
    async recomputeProductRating(productId) {
        const [stats] = await reviews_model_1.Review.aggregate([
            { $match: { product_id: productId } },
            {
                $group: {
                    _id: "$product_id",
                    avg_rating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);
        const avg = stats?.avg_rating ?? 0;
        const count = stats?.count ?? 0;
        await products_model_1.Product.updateOne({ _id: productId }, {
            $set: {
                rating_avg: avg,
                review_count: count,
            },
        });
    },
    async listOfProduct(productId, query) {
        if (!mongoose_1.Types.ObjectId.isValid(productId)) {
            throw new Error("Invalid product id");
        }
        const { page = 1, limit = 10 } = query;
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 10;
        const skip = (pageNum - 1) * limitNum;
        const filter = { product_id: new mongoose_1.Types.ObjectId(productId) };
        const [items, total, stats] = await Promise.all([
            reviews_model_1.Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name avatar_url images video_url is_edited")
                .lean(),
            reviews_model_1.Review.countDocuments(filter),
            reviews_model_1.Review.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$product_id",
                        avg_rating: { $avg: "$rating" },
                    },
                },
            ]),
        ]);
        const avg_rating = stats[0]?.avg_rating ?? 0;
        return {
            items,
            total,
            avg_rating,
            page: pageNum,
            limit: limitNum,
        };
    },
    async createReview(userId, payload) {
        const { product_id, rating, comment, images = [], video_url } = payload;
        if (!mongoose_1.Types.ObjectId.isValid(product_id)) {
            throw new Error("Invalid product id");
        }
        const productObjectId = new mongoose_1.Types.ObjectId(product_id);
        // đảm bảo product tồn tại & active (optional)
        const product = await products_model_1.Product.findOne({
            _id: productObjectId,
            is_active: true,
        });
        if (!product) {
            throw new Error("Product not found or inactive");
        }
        // check xem user đã review chưa (ngoài unique index)
        const existed = await reviews_model_1.Review.findOne({
            user_id: userId,
            product_id: productObjectId,
        });
        if (existed) {
            throw new Error("You have already reviewed this product");
        }
        await reviews_model_1.Review.create({
            user_id: userId,
            product_id: productObjectId,
            rating,
            comment,
            images,
            video_url: video_url ?? null,
            is_edited: false,
        });
        await this.recomputeProductRating(productObjectId);
        // trả về review mới nhất của user cho product đó
        const review = await reviews_model_1.Review.findOne({
            user_id: userId,
            product_id: productObjectId,
        }).lean();
        return review;
    },
    async updateReview(userId, reviewId, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(reviewId)) {
            throw new Error("Invalid review id");
        }
        const review = await reviews_model_1.Review.findOne({
            _id: reviewId,
            user_id: userId,
        });
        if (!review) {
            throw new Error("Review not found");
        }
        if (payload.rating !== undefined) {
            review.rating = payload.rating;
        }
        if (payload.comment !== undefined) {
            review.comment = payload.comment;
        }
        if (payload.images !== undefined) {
            review.images = payload.images;
        }
        if (payload.video_url !== undefined) {
            review.video_url = payload.video_url;
        }
        review.is_edited = true;
        await review.save();
        await this.recomputeProductRating(review.product_id);
        return review.toObject();
    },
    async removeReview(userId, reviewId) {
        if (!mongoose_1.Types.ObjectId.isValid(reviewId)) {
            throw new Error("Invalid review id");
        }
        const review = await reviews_model_1.Review.findOne({
            _id: reviewId,
            user_id: userId,
        });
        if (!review) {
            throw new Error("Review not found");
        }
        const productId = review.product_id;
        await review.deleteOne();
        // ⭐ tính lại rating_avg + review_count sau khi xoá
        await this.recomputeProductRating(productId);
        return true;
    },
};
