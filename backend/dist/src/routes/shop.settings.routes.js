"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOP_SETTINGS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const shop_settings_controller_1 = require("../modules/client/controllers/shop.settings.controller");
const router = express_1.default.Router();
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
router.get("/", shop_settings_controller_1.shopSettingsController.getPublicSettings);
exports.SHOP_SETTINGS_ROUTES = router;
