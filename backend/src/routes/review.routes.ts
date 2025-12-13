import express, { Router } from "express";
import { reviewController } from "../modules/client/controllers/review.controller";
import { uploadMiddlewares } from "../middleware/upload.middlewares";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Reviews
 *     description: Đánh giá sản phẩm
 */

/**
 * @swagger
 * /reviews/of/{productId}:
 *   get:
 *     summary: Danh sách review của 1 sản phẩm
 *     tags: [Client - Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/of/:productId", reviewController.listOfProduct);

router.use(authMidleWares.protectUserRoute);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Tạo review mới cho sản phẩm
 *     tags: [Client - Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               order_item_id:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo review thành công
 */
router.post(
  "/",
  uploadMiddlewares.upload.fields([
    { name: 'images', maxCount: 5 }, // Cho phép tối đa 5 ảnh
    { name: 'video', maxCount: 5 }   // Cho phép 1 video
  ]),
  reviewController.create
);

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Cập nhật review
 *     tags: [Client - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  "/:id",
  uploadMiddlewares.upload.fields([
    { name: 'images', maxCount: 5 }, // Cho phép tối đa 5 ảnh
    { name: 'video', maxCount: 5 }   // Cho phép 1 video
  ]),
  reviewController.update
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Xóa review
 *     tags: [Client - Reviews]
 *     security:
 *       - bearerAuth: []
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
router.delete("/:id", reviewController.remove);

export const REVIEW_ROUTES = router;
