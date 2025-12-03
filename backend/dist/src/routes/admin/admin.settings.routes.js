"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_SETTINGS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_shop_setting_controller_1 = require("../../modules/admin/controllers/admin.shop.setting.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin - Settings
 *     description: Cấu hình tổng thể cửa hàng (logo, shipping origin, banners...)
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
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
router.get("/", admin_shop_setting_controller_1.adminSettingsController.getSettings);
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
router.put("/general", upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_shop_setting_controller_1.adminSettingsController.updateGeneralSettings);
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
router.get("/shipping-origin", admin_shop_setting_controller_1.adminSettingsController.getShippingOrigin);
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
router.put("/shipping-origin", admin_shop_setting_controller_1.adminSettingsController.updateShippingOrigin);
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
router.get("/banners", admin_shop_setting_controller_1.adminSettingsController.getBanners);
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
router.post("/banners", upload_middlewares_1.uploadMiddlewares.upload.array("banners", 10), admin_shop_setting_controller_1.adminSettingsController.uploadBanners);
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
router.patch("/banners/reorder", admin_shop_setting_controller_1.adminSettingsController.reorderBanners);
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
router.delete("/banners/:bannerId", admin_shop_setting_controller_1.adminSettingsController.deleteBanner);
exports.ADMIN_SETTINGS_ROUTES = router;
