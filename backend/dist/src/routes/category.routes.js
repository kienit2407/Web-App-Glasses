"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTEGORY_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../modules/client/controllers/category.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Categories
 *     description: Danh mục sản phẩm
 */
/**
 * @swagger
 * /catalog/categories:
 *   get:
 *     summary: Lấy danh sách category
 *     tags: [Client - Categories]
 *     parameters:
 *       - in: query
 *         name: tree
 *         schema:
 *           type: integer
 *         description: 1 = trả về dạng cây
 *       - in: query
 *         name: active
 *         schema:
 *           type: integer
 *         description: 1 = chỉ lấy category active
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", category_controller_1.categoryController.listCategories);
exports.CARTEGORY_ROUTES = router;
