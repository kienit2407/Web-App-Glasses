import express, { Router } from "express"
import { adminCategoryController } from "../../modules/admin/controllers/admin.category.controller"

const router: Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin - Categories
 *     description: Quản lý danh mục sản phẩm
 */

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Danh sách category
 *     tags: [Admin - Categories]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", adminCategoryController.list)

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Tạo category mới
 *     tags: [Admin - Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo category thành công
 */
router.post("/", adminCategoryController.create)

/**
 * @swagger
 * /admin/categories/{id}:
 *   patch:
 *     summary: Cập nhật category
 *     tags: [Admin - Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id", adminCategoryController.update)

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Xóa category
 *     tags: [Admin - Categories]
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
router.delete("/:id", adminCategoryController.remove)

export const ADMIN_CATEGORIES_ROUTES = router
