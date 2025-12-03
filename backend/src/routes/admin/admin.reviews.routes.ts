import express, { Router } from "express"
import { adminReviewController } from "../../modules/admin/controllers/admin.review.controller"

const router: Router = express.Router()

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
router.get("/", adminReviewController.list)

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
router.delete("/:id", adminReviewController.remove)

export const ADMIN_REVIEWS_ROUTES = router
