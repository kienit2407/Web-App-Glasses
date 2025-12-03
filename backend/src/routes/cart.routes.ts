import express, { Router } from "express";
import { cartController } from "../modules/client/controllers/cart.controller";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Cart
 *     description: Giỏ hàng của user
 */

router.use(authMidleWares.protectUserRoute);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy giỏ hàng hiện tại của user
 *     tags: [Client - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", cartController.getMyCart);

/**
 * @swagger
 * /cart/add-item:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Client - Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               variant_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *             required:
 *               - product_id
 *               - variant_id
 *               - quantity
 *     responses:
 *       200:
 *         description: Thêm thành công
 */
router.post("/add-item", cartController.addItem);

/**
 * @swagger
 * /cart/update/{itemId}:
 *   patch:
 *     summary: Cập nhật số lượng 1 item trong giỏ
 *     tags: [Client - Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/update/:itemId", cartController.updateItem);

/**
 * @swagger
 * /cart/remove/{itemId}:
 *   delete:
 *     summary: Xóa 1 item khỏi giỏ
 *     tags: [Client - Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/remove/:itemId", cartController.removeItem);

export const CART_ROUTES = router;
