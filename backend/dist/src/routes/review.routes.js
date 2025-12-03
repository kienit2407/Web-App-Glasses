"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../modules/client/controllers/review.controller");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
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
router.get("/of/:productId", review_controller_1.reviewController.listOfProduct);
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.post("/", upload_middlewares_1.uploadMiddlewares.upload.fields([]), review_controller_1.reviewController.create);
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
router.patch("/:id", upload_middlewares_1.uploadMiddlewares.upload.fields([]), review_controller_1.reviewController.update);
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
router.delete("/:id", review_controller_1.reviewController.remove);
exports.REVIEW_ROUTES = router;
