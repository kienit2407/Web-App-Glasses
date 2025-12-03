"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../modules/client/controllers/auth.controller");
const auth_validation_1 = require("../validation/auth.validation");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Auth
 *     description: Đăng ký / đăng nhập / refresh token cho user
 */
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Client - Auth]
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
 *               phone:
 *                 type: string
 *             required:
 *               - full_name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/signup", auth_validation_1.authValidator.signUp, auth_controller_1.authController.signUp);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập user
 *     tags: [Client - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Đăng nhập thành công (set cookie refresh token)
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post("/login", auth_validation_1.authValidator.logIn, auth_controller_1.authController.signIn);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất user hiện tại
 *     tags: [Client - Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/logout", authMiddleware_1.authMidleWares.protectUserRoute, auth_controller_1.authController.logOut);
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token từ refresh token (cookie)
 *     tags: [Client - Auth]
 *     responses:
 *       200:
 *         description: Refresh token thành công, trả về access token mới
 *       401:
 *         description: Refresh token không hợp lệ hoặc hết hạn
 */
router.post("/refresh", auth_controller_1.authController.refreshToken);
exports.AUTH_ROUTES = router;
