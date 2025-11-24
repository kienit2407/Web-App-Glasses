"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReviewService = void 0;
// src/service/admin_review.service.ts
const mongoose_1 = require("mongoose");
const reviews_model_1 = require("../../../models/reviews.model");
const products_model_1 = require("../../../models/products.model");
const app_errol_1 = require("../../../utils/app_errol");
const user_model_1 = require("../../../models/user.model");
async function recomputeProductRating(productId) {
    const stats = await reviews_model_1.Review.aggregate([
        { $match: { product_id: productId } },
        {
            $group: {
                _id: "$product_id",
                count: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);
    if (stats.length === 0) {
        // không còn review nào
        await products_model_1.Product.findByIdAndUpdate(productId, {
            $set: {
                review_count: 0,
                rating_avg: 0,
            },
        });
    }
    else {
        const { count, avgRating } = stats[0];
        await products_model_1.Product.findByIdAndUpdate(productId, {
            $set: {
                review_count: count,
                rating_avg: Number(avgRating.toFixed(2)), // làm tròn 2 số lẻ cho đẹp
            },
        });
    }
}
exports.adminReviewService = {
    /**
     * List review cho admin, có filter theo product/user/rating + paging
     */
    async list(params) {
        const { page = 1, limit = 20, product_id, user_id, product_name, user_name, rating, } = params;
        const filter = {};
        // lọc trực tiếp theo id nếu FE gửi id
        if (product_id) {
            if (!mongoose_1.Types.ObjectId.isValid(product_id)) {
                throw new app_errol_1.BadRequestException("Invalid product_id");
            }
            filter.product_id = new mongoose_1.Types.ObjectId(product_id);
        }
        if (user_id) {
            if (!mongoose_1.Types.ObjectId.isValid(user_id)) {
                throw new app_errol_1.BadRequestException("Invalid user_id");
            }
            filter.user_id = new mongoose_1.Types.ObjectId(user_id);
        }
        // 🔹 lọc theo tên sản phẩm
        if (product_name) {
            const products = await products_model_1.Product.find({
                product_name: new RegExp(product_name.trim(), "i"),
            }).select("_id");
            const ids = products.map((p) => p._id);
            if (ids.length > 0) {
                filter.product_id = { $in: ids };
            }
            else {
                // không có sản phẩm nào khớp tên -> trả list rỗng
                return {
                    items: [],
                    pagination: { page: 1, limit, total: 0, totalPages: 1 },
                };
            }
        }
        // 🔹 lọc theo tên/email user
        if (user_name) {
            const users = await user_model_1.User.find({
                $or: [
                    { display_name: new RegExp(user_name.trim(), "i") },
                    { email: new RegExp(user_name.trim(), "i") },
                ],
            }).select("_id");
            const ids = users.map((u) => u._id);
            if (ids.length > 0) {
                filter.user_id = { $in: ids };
            }
            else {
                return {
                    items: [],
                    pagination: { page: 1, limit, total: 0, totalPages: 1 },
                };
            }
        }
        if (typeof rating === "number") {
            filter.rating = rating;
        }
        if (typeof rating === "number") {
            filter.rating = rating;
        }
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            reviews_model_1.Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name email")
                .populate("product_id", "product_name slug")
                .lean(),
            reviews_model_1.Review.countDocuments(filter),
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
    /**
     * Xoá review (moderation).
     * Sau khi xoá -> recompute lại rating_avg & review_count của product.
     */
    async remove(reviewId) {
        if (!mongoose_1.Types.ObjectId.isValid(reviewId)) {
            throw new app_errol_1.BadRequestException("Invalid review id");
        }
        const review = await reviews_model_1.Review.findById(reviewId);
        if (!review) {
            throw new app_errol_1.NotFoundException("Review not found");
        }
        const productId = review.product_id;
        await review.deleteOne();
        // cập nhật lại thống kê rating sản phẩm
        await recomputeProductRating(productId);
        return { success: true };
    },
};
