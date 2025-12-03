import express, { Router } from "express";
import { adminSettingsController } from "../../modules/admin/controllers/admin.shop.setting.controller";
import { authMidleWares } from "../../middleware/authMiddleware";
import { uploadMiddlewares } from "../../middleware/upload.middlewares";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Settings
 *     description: Cấu hình tổng thể cửa hàng (logo, shipping origin, banners...)
 */

router.use(
  authMidleWares.protectUserRoute,
);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Lấy full settings của shop
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", adminSettingsController.getSettings);

/**
 * @swagger
 * /admin/settings/general:
 *   put:
 *     summary: Cập nhật thông tin chung (tên shop, logo, email...)
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shop_name:
 *                 type: string
 *               support_email:
 *                 type: string
 *               hotline:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  "/general",
  uploadMiddlewares.upload.single("logo"),
  adminSettingsController.updateGeneralSettings
);

/**
 * @swagger
 * /admin/settings/shipping-origin:
 *   get:
 *     summary: Lấy địa chỉ kho gửi hàng (shipping origin)
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/shipping-origin", adminSettingsController.getShippingOrigin);

/**
 * @swagger
 * /admin/settings/shipping-origin:
 *   put:
 *     summary: Cập nhật địa chỉ kho gửi hàng
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               province_code:
 *                 type: string
 *               district_code:
 *                 type: string
 *               ward_code:
 *                 type: string
 *               specific_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/shipping-origin", adminSettingsController.updateShippingOrigin);

/**
 * @swagger
 * /admin/settings/banners:
 *   get:
 *     summary: Lấy danh sách banner
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/banners", adminSettingsController.getBanners);

/**
 * @swagger
 * /admin/settings/banners:
 *   post:
 *     summary: Upload nhiều banner
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               banners:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post(
  "/banners",
  uploadMiddlewares.upload.array("banners", 10),
  adminSettingsController.uploadBanners
);

/**
 * @swagger
 * /admin/settings/banners/reorder:
 *   patch:
 *     summary: Đổi thứ tự banners
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
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
 *                     banner_id:
 *                       type: string
 *                     position:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/banners/reorder", adminSettingsController.reorderBanners);

/**
 * @swagger
 * /admin/settings/banners/{bannerId}:
 *   delete:
 *     summary: Xóa 1 banner
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/banners/:bannerId", adminSettingsController.deleteBanner);

export const ADMIN_SETTINGS_ROUTES = router;
