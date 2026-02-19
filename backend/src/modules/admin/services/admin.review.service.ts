import { Types } from "mongoose";
import { Review } from "../../../models/reviews.model";
import { Product } from "../../../models/products.model";
import { User } from "../../../models/user.model";
import { BadRequestException, NotFoundException, ForbiddenException } from "../../../utils/app_errol";

interface ListAdminReviewsParams {
    page?: number;
    limit?: number;
    product_id?: string;
    user_id?: string;
    product_name?: string;
    user_name?: string;
    rating?: number;
}

async function recomputeProductRating(productId: Types.ObjectId) {
    const stats = await Review.aggregate([
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
        await Product.findByIdAndUpdate(productId, {
            $set: { review_count: 0, rating_avg: 0 },
        });
    } else {
        const { count, avgRating } = stats[0];
        await Product.findByIdAndUpdate(productId, {
            $set: { review_count: count, rating_avg: Number(avgRating.toFixed(2)) },
        });
    }
}

export const adminReviewService = {
    async list(params: ListAdminReviewsParams) {
        const { page = 1, limit = 20, product_id, user_id, product_name, user_name, rating } = params;

        const filter: any = {};

        if (product_id) {
            if (!Types.ObjectId.isValid(product_id)) throw new BadRequestException("Invalid product_id");
            filter.product_id = new Types.ObjectId(product_id);
        }

        if (user_id) {
            if (!Types.ObjectId.isValid(user_id)) throw new BadRequestException("Invalid user_id");
            filter.user_id = new Types.ObjectId(user_id);
        }

        if (product_name) {
            const products = await Product.find({
                product_name: new RegExp(product_name.trim(), "i"),
            }).select("_id");
            const ids = products.map((p) => p._id);
            if (ids.length > 0) filter.product_id = { $in: ids };
            else {
                return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
            }
        }

        if (user_name) {
            const users = await User.find({
                $or: [
                    { display_name: new RegExp(user_name.trim(), "i") },
                    { email: new RegExp(user_name.trim(), "i") },
                ],
            }).select("_id");
            const ids = users.map((u) => u._id);
            if (ids.length > 0) filter.user_id = { $in: ids };
            else {
                return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
            }
        }

        if (typeof rating === "number") filter.rating = rating;

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name email")
                .populate("product_id", "product_name slug")
                // ✅ populate admin reply author (nếu admin ref users)
                .populate("admin_reply.admin_id", "display_name email")
                .lean(),
            Review.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limitNum) || 1;

        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages } };
    },

    async remove(reviewId: string) {
        if (!Types.ObjectId.isValid(reviewId)) throw new BadRequestException("Invalid review id");

        const review = await Review.findById(reviewId);
        if (!review) throw new NotFoundException("Review not found");

        const productId = review.product_id;
        await review.deleteOne();
        await recomputeProductRating(productId);

        return { success: true };
    },

    // ✅ create/update reply
    async upsertReply(reviewId: string, adminId: string, content: string) {
        if (!Types.ObjectId.isValid(reviewId)) throw new BadRequestException("Invalid review id");
        if (!Types.ObjectId.isValid(adminId)) throw new BadRequestException("Invalid admin id");

        const review = await Review.findById(reviewId);
        if (!review) throw new NotFoundException("Review not found");

        const now = new Date();
        const existed = !!review.admin_reply?.content;

        review.admin_reply = {
            content,
            admin_id: new Types.ObjectId(adminId),
            createdAt: existed ? (review.admin_reply as any).createdAt : now,
            updatedAt: now,
            is_edited: existed ? true : false,
        } as any;

        await review.save();

        // trả về review đã populate để FE update mượt
        const populated = await Review.findById(reviewId)
            .populate("user_id", "display_name email")
            .populate("product_id", "product_name slug")
            .populate("admin_reply.admin_id", "display_name email")
            .lean();

        return populated;
    },

    // ✅ delete reply
    async removeReply(reviewId: string, adminId: string) {
        if (!Types.ObjectId.isValid(reviewId)) throw new BadRequestException("Invalid review id");
        if (!Types.ObjectId.isValid(adminId)) throw new BadRequestException("Invalid admin id");

        const review = await Review.findById(reviewId);
        if (!review) throw new NotFoundException("Review not found");

        // optional: chỉ cho admin đã reply mới xoá (bạn thích chặt chẽ)
        // nếu admin nào cũng được xoá thì bỏ đoạn này
        if (review.admin_reply?.admin_id && String(review.admin_reply.admin_id) !== String(adminId)) {
            throw new ForbiddenException("You cannot delete other admin's reply");
        }

        review.admin_reply = null;
        await review.save();

        const populated = await Review.findById(reviewId)
            .populate("user_id", "display_name email")
            .populate("product_id", "product_name slug")
            .populate("admin_reply.admin_id", "display_name email")
            .lean();

        return populated;
    },
};
