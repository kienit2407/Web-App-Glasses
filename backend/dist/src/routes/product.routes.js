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
 *         product_name:
 *           type: string
 *           description: Tên sản phẩm
 *           example: "Kính râm RayBan"
 *         price:
 *           type: number
 *           description: Giá hiển thị (thấp nhất sau khuyến mãi)
 *           example: 4500000
 *         thumbnail_url:
 *           type: string
 *           description: Ảnh đại diện
 *           example: "https://example.com/img.jpg"
 */
/**
 * @swagger
 * /catalog/products/search-suggest:
 *   get:
 *     summary: Gợi ý tìm kiếm sản phẩm (keywords + sản phẩm + thương hiệu)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: string
 *                           product_name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           brand_id:
 *                             type: string
 *                           brand_name:
 *                             type: string
 *                           logo_url:
 *                             type: string
 */
router.get("/search-suggest", product_controller_1.productController.getSearchSuggestions);
/**
 * @swagger
 * /catalog/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm public (có filter + sort + pagination)
 *     tags: [Client - Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tên, tags)
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Danh sách category_id, phân cách bằng dấu phẩy
 *       - in: query
 *         name: brands
 *         schema:
 *           type: string
 *         description: Danh sách brand_id, phân cách bằng dấu phẩy
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating, most_sold]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, kids, unisex]
 *       - in: query
 *         name: shape
 *         schema:
 *           type: string
 *         description: "Frame shape (vd: round, square, cat-eye...)"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get("/", product_controller_1.productController.getProducts);
/**
 * @swagger
 * /catalog/products/{productId}:
 *   get:
 *     summary: Xem chi tiết sản phẩm (product + variants + images)
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
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Thông tin chi tiết sản phẩm, variants và images
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get("/:productId", product_controller_1.productController.getProductDetail);
exports.PRODUCT_ROUTES = router;
