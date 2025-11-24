import express, { Router } from "express";
import { adminSettingsController } from "../../modules/admin/controllers/admin.shop.setting.controller";
import { authMidleWares } from "../../middleware/authMiddleware";
import { uploadMiddlewares } from "../../middleware/upload.middlewares";
// import { authMidleWares } from "../middleware/auth_middleware";

const router: Router = express.Router();

// chỉ cho admin
router.use(
    authMidleWares.protectUserRoute,
);

// FULL SETTINGS
// GET /admin/settings
router.get("/", adminSettingsController.getSettings);

// GENERAL SETTINGS (name/logo/email)
// PUT /admin/settings/general  (multipart/form-data, field "logo")
router.put(
    "/general",
    uploadMiddlewares.upload.single("logo"),
    adminSettingsController.updateGeneralSettings
);

// SHIPPING ORIGIN (địa chỉ kho gửi)
router.get("/shipping-origin", adminSettingsController.getShippingOrigin);
router.put("/shipping-origin", adminSettingsController.updateShippingOrigin);

// BANNERS
router.get("/banners", adminSettingsController.getBanners);
router.post(
    "/banners",
    uploadMiddlewares.upload.array("banners", 10),
    adminSettingsController.uploadBanners
);
router.patch("/banners/reorder", adminSettingsController.reorderBanners);
router.delete("/banners/:bannerId", adminSettingsController.deleteBanner);
export const ADMIN_SETTINGS_ROUTES = router;
