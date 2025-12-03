"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../modules/client/controllers/product.controller");
const router = express_1.default.Router();
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
router.get("/search-suggest", product_controller_1.productController.getSearchSuggestions);
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
router.get("/", product_controller_1.productController.getProducts);
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
router.get("/:productId", product_controller_1.productController.getProductDetail);
exports.PRODUCT_ROUTES = router;
