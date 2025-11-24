// src/controllers/review.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from "../../../utils/app_errol";
import { reviewService } from "../services/review.service";
import { uploadToCloud } from "../../../config/cloudinary";

// GET /reviews/of/:productId?&page=&limit=
const listOfProduct = TryCatch(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { page, limit } = req.query;

    const p = page ? Number(page) : undefined;
    const l = limit ? Number(limit) : undefined;

    try {
        const result = await reviewService.listOfProduct(productId, {
            page: p,
            limit: l,
        });
        console.log(result)
        return res.json({
            data: result.items,
            meta: {
                total: result.total,
                avg_rating: result.avg_rating,
                page: result.page,
                limit: result.limit,
            },
        });
    } catch (err: any) {
        if (err.message === "Invalid product id") {
            throw new BadRequestException(err.message);
        }
        throw new BadRequestException(err.message || "Cannot list reviews");
    }
});

// POST /reviews
const create = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { product_id, rating, comment } = req.body;
    if (!product_id || rating === undefined || !comment) {
        throw new BadRequestException("product_id, rating, comment are required");
    }

    const userId = new Types.ObjectId(req.user._id);

    // media từ multer.fields
    const fileMap = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };

    const imageFiles = fileMap?.images ?? [];
    const videoFile = fileMap?.video?.[0];

    const imageMetas: { url: string; url_id: string }[] = [];
    let videoUrl: string | undefined;

    // ✅ giống product: upload từng file một, không cần uploadMany
    for (const file of imageFiles) {
        const uploaded = await uploadToCloud(file, "reviews/images");
        imageMetas.push(uploaded);
    }

    if (videoFile) {
        const uploadedVideo = await uploadToCloud(videoFile, "reviews/videos");
        videoUrl = uploadedVideo.url;
    }

    try {
        const review = await reviewService.createReview(userId, {
            product_id,
            rating: Number(rating),
            comment,
            images: imageMetas,   // nhớ thêm vào DTO + schema
            video_url: videoUrl,  // nếu bạn lưu video
        });

        return res.status(201).json({ data: review });
    } catch (err: any) {
        if (
            err.message === "Product not found or inactive" ||
            err.message === "You have already reviewed this product"
        ) {
            throw new BadRequestException(err.message);
        }
        throw new BadRequestException(err.message || "Cannot create review");
    }
});

const update = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = new Types.ObjectId(req.user._id);

    // ✅ LẤY FILE TỪ MULTER.FIELDS
    const fileMap = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };

    const imageFiles = fileMap?.images ?? [];
    const videoFile = fileMap?.video?.[0];

    const imageMetas: { url: string; url_id: string }[] = [];
    let videoUrl: string | null = null;

    // upload từng ảnh
    for (const file of imageFiles) {
        const uploaded = await uploadToCloud(file, "reviews/images");
        imageMetas.push(uploaded);
    }

    // upload video nếu có
    if (videoFile) {
        const uploadedVideo = await uploadToCloud(videoFile, "reviews/videos");
        videoUrl = uploadedVideo.url;
    }

    try {
        const payload: any = {};

        if (rating !== undefined) {
            payload.rating = Number(rating);
        }
        if (comment !== undefined) {
            payload.comment = comment;
        }

        // chỉ set nếu có gửi ảnh mới
        if (imageMetas.length > 0) {
            payload.images = imageMetas;
        }

        // chỉ set nếu có gửi video mới
        if (videoUrl !== null) {
            payload.video_url = videoUrl;
        }

        const review = await reviewService.updateReview(userId, id, payload);

        return res.json({ data: review });
    } catch (err: any) {
        if (err.message === "Review not found") {
            throw new NotFoundException(err.message);
        }
        if (err.message === "Invalid review id") {
            throw new BadRequestException(err.message);
        }
        throw new BadRequestException(err.message || "Cannot update review");
    }
});

// DELETE /reviews/:id
const remove = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { id } = req.params;
    const userId = new Types.ObjectId(req.user._id);

    try {
        await reviewService.removeReview(userId, id);

        return res.json({ data: true });
    } catch (err: any) {
        if (err.message === "Review not found") {
            throw new NotFoundException(err.message);
        }
        if (err.message === "Invalid review id") {
            throw new BadRequestException(err.message);
        }
        throw new BadRequestException(err.message || "Cannot delete review");
    }
});

export const reviewController = {
    listOfProduct,
    create,
    update,
    remove,
};
