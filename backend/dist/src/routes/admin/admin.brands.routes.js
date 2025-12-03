"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_BRANDS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_brand_controller_1 = require("../../modules/admin/controllers/admin.brand.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = express_1.default.Router();
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
router.get("/", admin_brand_controller_1.adminBrandController.list);
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
router.post("/", upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_brand_controller_1.adminBrandController.create);
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
router.patch("/:id", upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_brand_controller_1.adminBrandController.update);
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
router.delete("/:id", admin_brand_controller_1.adminBrandController.remove);
exports.ADMIN_BRANDS_ROUTES = router;
