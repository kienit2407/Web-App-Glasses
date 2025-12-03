"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_USERS_ROUTES = void 0;
const admin_user_controller_1 = require("../../modules/admin/controllers/admin.user.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin - Users
 *     description: Quản lý user khách hàng / admin
 */
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Danh sách user (tìm kiếm + phân trang)
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", admin_user_controller_1.adminUsersController.list);
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Xem chi tiết 1 user
 *     tags: [Admin - Users]
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
router.get("/:id", admin_user_controller_1.adminUsersController.detail);
/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Tạo mới 1 user (thường là admin/staff)
 *     tags: [Admin - Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo user thành công
 */
router.post("/", admin_user_controller_1.adminUsersController.create);
/**
 * @swagger
 * /admin/users/{id}/login-history:
 *   get:
 *     summary: Xem lịch sử đăng nhập của user
 *     tags: [Admin - Users]
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
router.get("/:id/login-history", admin_user_controller_1.adminUsersController.getLoginHistory);
/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hoạt động của user (is_active)
 *     tags: [Admin - Users]
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
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id/status", admin_user_controller_1.adminUsersController.updateStatus);
/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Cập nhật role của user
 *     tags: [Admin - Users]
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
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id/role", admin_user_controller_1.adminUsersController.updateRole);
/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Xóa (mềm) user (set is_active=false)
 *     tags: [Admin - Users]
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
router.delete("/:id", admin_user_controller_1.adminUsersController.remove);
exports.ADMIN_USERS_ROUTES = router;
