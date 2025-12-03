import express, { Router } from "express";
import { addressController } from "../modules/client/controllers/address.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Addresses
 *     description: Địa chỉ giao hàng của user
 */

/**
 * @swagger
 * /users/me/address:
 *   get:
 *     summary: Lấy danh sách địa chỉ của user
 *     tags: [Client - Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.use(authMidleWares.protectUserRoute);

router.get("/", addressController.listMy);

/**
 * @swagger
 * /users/me/address:
 *   post:
 *     summary: Thêm địa chỉ mới cho user
 *     tags: [Client - Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               province_code:
 *                 type: string
 *               district_code:
 *                 type: string
 *               ward_code:
 *                 type: string
 *               specific_address:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo địa chỉ thành công
 */
router.post("/", addressController.createMy);

/**
 * @swagger
 * /users/me/address/{addressId}:
 *   patch:
 *     summary: Cập nhật địa chỉ
 *     tags: [Client - Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
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
router.patch("/:addressId", addressController.updateMy);

/**
 * @swagger
 * /users/me/address/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Client - Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:addressId", addressController.deleteMy);

/**
 * @swagger
 * /users/me/address/{addressId}/default:
 *   patch:
 *     summary: Đặt địa chỉ mặc định
 *     tags: [Client - Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch("/:addressId/default", addressController.setDefaultMy);

export const ADDRESS_ROUTES = router;
