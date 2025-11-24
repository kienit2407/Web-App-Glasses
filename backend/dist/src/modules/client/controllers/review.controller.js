"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const review_service_1 = require("../services/review.service");
const cloudinary_1 = require("../../../config/cloudinary");
// GET /reviews/of/:productId?&page=&limit=
const listOfProduct = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { productId } = req.params;
    const { page, limit } = req.query;
    const p = page ? Number(page) : undefined;
    const l = limit ? Number(limit) : undefined;
    try {
        const result = await review_service_1.reviewService.listOfProduct(productId, {
            page: p,
            limit: l,
        });
        return res.json({
            data: result.items,
            meta: {
                total: result.total,
                avg_rating: result.avg_rating,
                page: result.page,
                limit: result.limit,
            },
        });
    }
    catch (err) {
        if (err.message === "Invalid product id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot list reviews");
    }
});
// POST /reviews
const create = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { product_id, rating, comment } = req.body;
    if (!product_id || rating === undefined || !comment) {
        throw new app_errol_1.BadRequestException("product_id, rating, comment are required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    // media từ multer.fields
    const fileMap = req.files;
    const imageFiles = fileMap?.images ?? [];
    const videoFile = fileMap?.video?.[0];
    const imageMetas = [];
    let videoUrl;
    // ✅ giống product: upload từng file một, không cần uploadMany
    for (const file of imageFiles) {
        const uploaded = await (0, cloudinary_1.uploadToCloud)(file, "reviews/images");
        imageMetas.push(uploaded);
    }
    if (videoFile) {
        const uploadedVideo = await (0, cloudinary_1.uploadToCloud)(videoFile, "reviews/videos");
        videoUrl = uploadedVideo.url;
    }
    try {
        const review = await review_service_1.reviewService.createReview(userId, {
            product_id,
            rating: Number(rating),
            comment,
            images: imageMetas, // nhớ thêm vào DTO + schema
            video_url: videoUrl, // nếu bạn lưu video
        });
        return res.status(201).json({ data: review });
    }
    catch (err) {
        if (err.message === "Product not found or inactive" ||
            err.message === "You have already reviewed this product") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot create review");
    }
});
// PATCH /reviews/:id
const update = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        const review = await review_service_1.reviewService.updateReview(userId, id, {
            rating,
            comment,
        });
        return res.json({ data: review });
    }
    catch (err) {
        if (err.message === "Review not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        if (err.message === "Invalid review id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot update review");
    }
});
// DELETE /reviews/:id
const remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { id } = req.params;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        await review_service_1.reviewService.removeReview(userId, id);
        return res.json({ data: true });
    }
    catch (err) {
        if (err.message === "Review not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        if (err.message === "Invalid review id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot delete review");
    }
});
exports.reviewController = {
    listOfProduct,
    create,
    update,
    remove,
};
