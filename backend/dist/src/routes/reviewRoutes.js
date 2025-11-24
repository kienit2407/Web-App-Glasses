"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// đổi từ :legacyId → :productId (_id của MongoDB)
router.get("/product/:productId", reviewController_1.getReviewsByProduct);
router.post("/", authMiddleware_1.protect, reviewController_1.addReview);
router.put("/:id", authMiddleware_1.protect, reviewController_1.updateReview);
router.delete("/:id", authMiddleware_1.protect, reviewController_1.deleteReview);
router.get("/", reviewController_1.getAllReviews); // Thêm route để lấy tất cả đánh giá
exports.default = router;
