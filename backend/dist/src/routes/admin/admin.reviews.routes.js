"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_REVIEWS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_review_controller_1 = require("../../modules/admin/controllers/admin.review.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin - Reviews
 *     description: Moderation đánh giá sản phẩm
 */
/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Danh sách review (lọc theo product/user)
 *     tags: [Admin - Reviews]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", admin_review_controller_1.adminReviewController.list);
/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     summary: Xóa review (moderation)
 *     tags: [Admin - Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", admin_review_controller_1.adminReviewController.remove);
exports.ADMIN_REVIEWS_ROUTES = router;
