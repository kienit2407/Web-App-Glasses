import express, { Router } from "express"
import { adminPromotionController } from "../../modules/admin/controllers/admin.promotion.controller"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"

const router: Router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin - Promotions
 *     description: Quản lý chương trình khuyến mãi & liên kết coupons/brands/products
 */

/**
 * @swagger
 * /admin/promotions:
 *   get:
 *     summary: Danh sách promotions
 *     tags: [Admin - Promotions]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", adminPromotionController.list)

/**
 * @swagger
 * /admin/promotions:
 *   post:
 *     summary: Tạo promotion mới
 *     tags: [Admin - Promotions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *               end_date:
 *                 type: string
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tạo promotion thành công
 */
router.post(
  "/",
  uploadMiddlewares.upload.single("banner"),
  adminPromotionController.create
)

/**
 * @swagger
 * /admin/promotions/{id}:
 *   patch:
 *     summary: Cập nhật promotion
 *     tags: [Admin - Promotions]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *               end_date:
 *                 type: string
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  "/:id",
  uploadMiddlewares.upload.single("banner"),
  adminPromotionController.update
)

/**
 * @swagger
 * /admin/promotions/{id}:
 *   delete:
 *     summary: Xóa promotion
 *     tags: [Admin - Promotions]
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
router.delete("/:id", adminPromotionController.remove)

/**
 * @swagger
 * /admin/promotions/{id}/relations:
 *   get:
 *     summary: Lấy quan hệ (coupons/brands/products) của 1 promotion
 *     tags: [Admin - Promotions]
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
router.get("/:id/relations", adminPromotionController.relations);

/**
 * @swagger
 * /admin/promotions/{id}/coupons/{couponId}:
 *   post:
 *     summary: Gắn 1 coupon vào promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: couponId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/:id/coupons/:couponId", adminPromotionController.linkCoupon)

/**
 * @swagger
 * /admin/promotions/{id}/coupons/{couponId}:
 *   delete:
 *     summary: Gỡ coupon khỏi promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: couponId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete("/:id/coupons/:couponId", adminPromotionController.unlinkCoupon)

/**
 * @swagger
 * /admin/promotions/{id}/brands/{brandId}:
 *   post:
 *     summary: Gắn brand vào promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/:id/brands/:brandId", adminPromotionController.linkBrand)

/**
 * @swagger
 * /admin/promotions/{id}/brands/{brandId}:
 *   delete:
 *     summary: Gỡ brand khỏi promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete("/:id/brands/:brandId", adminPromotionController.unlinkBrand)

/**
 * @swagger
 * /admin/promotions/{id}/products/{productId}:
 *   post:
 *     summary: Gắn sản phẩm vào promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/:id/products/:productId", adminPromotionController.linkProduct)

/**
 * @swagger
 * /admin/promotions/{id}/products/{productId}:
 *   delete:
 *     summary: Gỡ sản phẩm khỏi promotion
 *     tags: [Admin - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete("/:id/products/:productId", adminPromotionController.unlinkProduct)

export const ADMIN_PROMOTIONS_ROUTES = router
