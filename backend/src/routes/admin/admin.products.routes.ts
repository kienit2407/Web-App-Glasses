import express, { Router } from "express"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"
import { adminProductController } from "../../modules/admin/controllers/admin.product.controller"
import { authMidleWares } from "../../middleware/authMiddleware"

const router: Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin - Products
 *     description: Quản lý sản phẩm, variants và images
 */

router.use(
  authMidleWares.protectUserRoute,
  authMidleWares.protectAdminRoute
)

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Danh sách sản phẩm (admin) với filter + phân trang
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: active | inactive | draft
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
router.get("/", adminProductController.list)

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Tạo sản phẩm mới (chưa có variants)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *               category_id:
 *                 type: string
 *               brand_id:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */
router.post(
  "/",
  uploadMiddlewares.upload.single("thumbnail"),
  adminProductController.create
)

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Chi tiết sản phẩm (đếm số variant, ảnh...)
 *     tags: [Admin - Products]
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
 *         description: Thành công
 */
router.get("/:id", adminProductController.detail)

/**
 * @swagger
 * /admin/products/{id}:
 *   patch:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Admin - Products]
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
 *             properties:
 *               product_name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  "/:id",
  uploadMiddlewares.upload.single("thumbnail"),
  adminProductController.update
)

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm (mặc định xoá mềm)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: true = cố gắng xoá cứng
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", adminProductController.remove)


// ========== VARIANTS ==========

/**
 * @swagger
 * /admin/products/{id}/variants:
 *   get:
 *     summary: Danh sách variants của 1 product
 *     tags: [Admin - Products]
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
 *         description: Thành công
 */
router.get("/:id/variants", adminProductController.listVariants)

/**
 * @swagger
 * /admin/products/variants/{variantId}:
 *   get:
 *     summary: Chi tiết 1 variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/variants/:variantId", adminProductController.variantDetail)

/**
 * @swagger
 * /admin/products/{id}/variants:
 *   post:
 *     summary: Tạo variant mới cho 1 product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Thông tin variant (sku, giá, màu, size...)
 *     responses:
 *       201:
 *         description: Tạo variant thành công
 */
router.post("/:id/variants", adminProductController.createVariant)

/**
 * @swagger
 * /admin/products/variants/{variantId}:
 *   patch:
 *     summary: Cập nhật variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
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
router.patch("/variants/:variantId", adminProductController.updateVariant)

/**
 * @swagger
 * /admin/products/variants/{variantId}:
 *   delete:
 *     summary: Xóa (mềm) variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/variants/:variantId", adminProductController.removeVariant)


// ========== VARIANT IMAGES ==========

/**
 * @swagger
 * /admin/products/variants/{variantId}/images:
 *   get:
 *     summary: Danh sách ảnh của 1 variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  "/variants/:variantId/images",
  adminProductController.listVariantImages
)

/**
 * @swagger
 * /admin/products/{id}/variants/{variantId}/images:
 *   post:
 *     summary: Upload nhiều ảnh cho 1 variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  "/:id/variants/:variantId/images",
  uploadMiddlewares.upload.array("images", 5),
  adminProductController.upsertVariantImage
)

/**
 * @swagger
 * /admin/products/variants/{variantId}/images/reorder:
 *   patch:
 *     summary: Đổi thứ tự ảnh của 1 variant
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     image_id:
 *                       type: string
 *                     position:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thứ tự thành công
 */
router.patch(
  "/variants/:variantId/images/reorder",
  adminProductController.reorderVariantImages
)

/**
 * @swagger
 * /admin/products/images/{imageId}:
 *   delete:
 *     summary: Xóa 1 ảnh product/variant theo imageId
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/images/:imageId", adminProductController.deleteImage)

export const ADMIN_PRODUCTS_ROUTES = router
