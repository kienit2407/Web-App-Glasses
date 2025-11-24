"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_SETTINGS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_shop_setting_controller_1 = require("../../modules/admin/controllers/admin.shop.setting.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
// import { authMidleWares } from "../middleware/auth_middleware";
const router = express_1.default.Router();
// chỉ cho admin
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// FULL SETTINGS
// GET /admin/settings
router.get("/", admin_shop_setting_controller_1.adminSettingsController.getSettings);
// GENERAL SETTINGS (name/logo/email)
// PUT /admin/settings/general  (multipart/form-data, field "logo")
router.put("/general", upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_shop_setting_controller_1.adminSettingsController.updateGeneralSettings);
// SHIPPING ORIGIN (địa chỉ kho gửi)
router.get("/shipping-origin", admin_shop_setting_controller_1.adminSettingsController.getShippingOrigin);
router.put("/shipping-origin", admin_shop_setting_controller_1.adminSettingsController.updateShippingOrigin);
// BANNERS
router.get("/banners", admin_shop_setting_controller_1.adminSettingsController.getBanners);
router.post("/banners", upload_middlewares_1.uploadMiddlewares.upload.array("banners", 10), admin_shop_setting_controller_1.adminSettingsController.uploadBanners);
router.patch("/banners/reorder", admin_shop_setting_controller_1.adminSettingsController.reorderBanners);
router.delete("/banners/:bannerId", admin_shop_setting_controller_1.adminSettingsController.deleteBanner);
exports.ADMIN_SETTINGS_ROUTES = router;
