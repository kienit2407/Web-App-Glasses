import { adminUsersController } from "../../modules/admin/controllers/admin.user.controller"
import express, { Router } from "express"

const router: Router = express.Router()

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
router.get("/", adminUsersController.list)

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
router.get("/:id", adminUsersController.detail)

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
router.post("/", adminUsersController.create)

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
router.get("/:id/login-history", adminUsersController.getLoginHistory)

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
router.patch("/:id/status", adminUsersController.updateStatus)

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
router.patch("/:id/role", adminUsersController.updateRole)

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
router.delete("/:id", adminUsersController.remove)

export const ADMIN_USERS_ROUTES = router
