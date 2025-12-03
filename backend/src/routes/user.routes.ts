import express, { Router } from "express";
import { userController } from "../modules/client/controllers/user.controller";
import { authMidleWares } from "../middleware/authMiddleware";
import { uploadMiddlewares } from "../middleware/upload.middlewares";

const router: Router = express.Router();

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
router.use(authMidleWares.protectUserRoute);

router.get("/me", userController.getMe);

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
router.patch(
  "/me",
  uploadMiddlewares.upload.single("file"),
  userController.updateMe
);

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
router.patch("/me/password", userController.changePassword);

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
router.get("/me/coupons", userController.listMyCoupons);

export const USER_ROUTES = router;
