import express, { Router } from "express"
import { adminBrandController } from "../../modules/admin/controllers/admin.brand.controller"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"

const router: Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin - Brands
 *     description: Quản lý thương hiệu (brand) trong admin
 */

/**
 * @swagger
 * /admin/brands:
 *   get:
 *     summary: Danh sách brand (admin)
 *     tags: [Admin - Brands]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Tìm theo tên brand
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", adminBrandController.list)

/**
 * @swagger
 * /admin/brands:
 *   post:
 *     summary: Tạo brand mới
 *     tags: [Admin - Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo brand thành công
 */
router.post(
  "/",
  uploadMiddlewares.upload.single("logo"),
  adminBrandController.create
)

/**
 * @swagger
 * /admin/brands/{id}:
 *   patch:
 *     summary: Cập nhật brand
 *     tags: [Admin - Brands]
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
 *             properties:
 *               brand_name:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  "/:id",
  uploadMiddlewares.upload.single("logo"),
  adminBrandController.update
)

/**
 * @swagger
 * /admin/brands/{id}:
 *   delete:
 *     summary: Xóa (mềm) brand
 *     tags: [Admin - Brands]
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
router.delete("/:id", adminBrandController.remove)

export const ADMIN_BRANDS_ROUTES = router
