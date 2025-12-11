import express, { Router } from "express";
import { authController } from "../modules/client/controllers/auth.controller";
import { authValidator } from "../validation/auth.validation";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();
router.get("/google", authController.oauthGoogle)
router.get("/google/callback", authController.oauthGoogleCallback)
router.get("/github", authController.oauthGithub);
router.get("/github/callback", authController.oauthGithubCallback);
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
router.post("/signup", authValidator.signUp, authController.signUp);

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
router.post("/login", authValidator.logIn, authController.signIn);

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
router.post("/logout", authMidleWares.protectUserRoute, authController.logOut);

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
router.post("/refresh", authController.refreshToken);

export const AUTH_ROUTES = router;
