import express, { Router } from "express";
import { categoryController } from "../modules/client/controllers/category.controller";

const router: Router = express.Router();

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
router.get("/", categoryController.listCategories);

export const CARTEGORY_ROUTES = router;
