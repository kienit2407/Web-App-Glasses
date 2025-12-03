import express, { Router } from "express";
import { productController } from "../modules/client/controllers/product.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Products
 *     description: API hiển thị sản phẩm cho khách hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID sản phẩm
 *           example: "60d0fe4f5311236168a109ca"
 *         name:
 *           type: string
 *           description: Tên sản phẩm
 *           example: "Kính râm RayBan"
 *         price:
 *           type: number
 *           description: Giá bán
 *           example: 4500000
 *         thumb:
 *           type: string
 *           description: Ảnh đại diện
 *           example: "https://example.com/img.jpg"
 */

/**
 * @swagger
 * /catalog/products/search-suggest:
 *   get:
 *     summary: Gợi ý tìm kiếm
 *     tags: [Client - Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/search-suggest", productController.getSearchSuggestions);

/**
 * @swagger
 * /catalog/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Client - Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang số
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", productController.getProducts);

/**
 * @swagger
 * /catalog/products/{productId}:
 *   get:
 *     summary: Xem chi tiết sản phẩm
 *     tags: [Client - Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.get("/:productId", productController.getProductDetail);

export const PRODUCT_ROUTES = router;
