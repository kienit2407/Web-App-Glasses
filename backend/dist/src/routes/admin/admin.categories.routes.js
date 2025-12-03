"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_CATEGORIES_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_category_controller_1 = require("../../modules/admin/controllers/admin.category.controller");
const router = express_1.default.Router();
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
router.get("/", admin_category_controller_1.adminCategoryController.list);
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
router.post("/", admin_category_controller_1.adminCategoryController.create);
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
router.patch("/:id", admin_category_controller_1.adminCategoryController.update);
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
router.delete("/:id", admin_category_controller_1.adminCategoryController.remove);
exports.ADMIN_CATEGORIES_ROUTES = router;
