import express, { Router } from "express";
import { shopSettingsController } from "../modules/client/controllers/shop.settings.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Shop Settings
 *     description: Cấu hình hiển thị public (logo, hotline, địa chỉ...)
 */

/**
 * @swagger
 * /shop-settings:
 *   get:
 *     summary: Lấy cấu hình public của shop
 *     tags: [Client - Shop Settings]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", shopSettingsController.getPublicSettings);

export const SHOP_SETTINGS_ROUTES = router;
