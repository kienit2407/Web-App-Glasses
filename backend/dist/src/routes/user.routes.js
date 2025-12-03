"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../modules/client/controllers/user.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Users
 *     description: API quản lý thông tin user hiện tại
 */
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Lấy thông tin profile user hiện tại
 *     tags: [Client - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/me", user_controller_1.userController.getMe);
/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Cập nhật thông tin profile user (kèm avatar)
 *     tags: [Client - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh avatar mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/me", upload_middlewares_1.uploadMiddlewares.upload.single("file"), user_controller_1.userController.updateMe);
/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Đổi mật khẩu user
 *     tags: [Client - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *             required:
 *               - old_password
 *               - new_password
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.patch("/me/password", user_controller_1.userController.changePassword);
/**
 * @swagger
 * /users/me/coupons:
 *   get:
 *     summary: Danh sách coupon của user
 *     tags: [Client - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/me/coupons", user_controller_1.userController.listMyCoupons);
exports.USER_ROUTES = router;
