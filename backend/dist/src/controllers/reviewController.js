"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.addReview = exports.getAllReviews = exports.getReviewsByProduct = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Product_1 = __importDefault(require("../models/Product"));
// GET /api/reviews/product/:productId
const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product_1.default.findById(productId); // dùng _id
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const reviews = await Review_1.default.find({ product: product._id }).sort({ createdAt: -1 });
        return res.json({ reviews });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getReviewsByProduct = getReviewsByProduct;
// GET /api/reviews
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review_1.default.find().sort({ createdAt: -1 });
        return res.json({ reviews });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getAllReviews = getAllReviews;
// POST /api/reviews
const addReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const product = await Product_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        let status = 'Pending';
        if (rating === 5) {
            status = 'Approved';
        }
        else if (rating === 1) {
            status = 'Rejected';
        }
        const review = await Review_1.default.create({
            product: product._id,
            author: `${user.firstName} ${user.lastName}`,
            authorId: user._id,
            rating,
            title,
            comment,
            verified: true,
            helpfulCount: 0,
            status,
        });
        return res.status(201).json({ review });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.addReview = addReview;
// PUT /api/reviews/:id
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const review = await Review_1.default.findById(id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        if (review.authorId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        const { rating, title, comment } = req.body;
        const newRating = rating ?? review.rating;
        review.rating = newRating;
        review.title = title ?? review.title;
        review.comment = comment ?? review.comment;
        let status = review.status;
        if (rating !== undefined) {
            if (newRating === 5) {
                status = 'Approved';
            }
            else if (newRating === 1) {
                status = 'Rejected';
            }
            else {
                status = 'Pending';
            }
        }
        review.status = status;
        await review.save();
        return res.json({ review }); // 👈 bọc vào object
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateReview = updateReview;
// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const review = await Review_1.default.findById(id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        if (review.authorId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await review.deleteOne();
        return res.json({ message: "Review deleted" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.deleteReview = deleteReview;
