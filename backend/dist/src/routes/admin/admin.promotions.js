"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PROMOTIONS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_promotion_controller_1 = require("../../modules/admin/controllers/admin.promotion.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = express_1.default.Router();
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
router.get("/", admin_promotion_controller_1.adminPromotionController.list);
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
router.post("/", upload_middlewares_1.uploadMiddlewares.upload.single("banner"), admin_promotion_controller_1.adminPromotionController.create);
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
router.patch("/:id", upload_middlewares_1.uploadMiddlewares.upload.single("banner"), admin_promotion_controller_1.adminPromotionController.update);
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
router.delete("/:id", admin_promotion_controller_1.adminPromotionController.remove);
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
router.get("/:id/relations", admin_promotion_controller_1.adminPromotionController.relations);
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
router.post("/:id/coupons/:couponId", admin_promotion_controller_1.adminPromotionController.linkCoupon);
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
router.delete("/:id/coupons/:couponId", admin_promotion_controller_1.adminPromotionController.unlinkCoupon);
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
router.post("/:id/brands/:brandId", admin_promotion_controller_1.adminPromotionController.linkBrand);
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
router.delete("/:id/brands/:brandId", admin_promotion_controller_1.adminPromotionController.unlinkBrand);
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
router.post("/:id/products/:productId", admin_promotion_controller_1.adminPromotionController.linkProduct);
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
router.delete("/:id/products/:productId", admin_promotion_controller_1.adminPromotionController.unlinkProduct);
exports.ADMIN_PROMOTIONS_ROUTES = router;
