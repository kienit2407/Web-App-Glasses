"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSettingsController = exports.getPublicSettings = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const admin_shop_setting_service_1 = require("../../admin/services/admin.shop.setting.service");
exports.getPublicSettings = (0, try_catch_1.TryCatch)(async (req, res) => {
    const settings = await admin_shop_setting_service_1.settingsService.getFullSettings();
    return res.json({ data: settings });
});
exports.shopSettingsController = {
    getPublicSettings: exports.getPublicSettings,
};
