"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingsController = exports.updateGeneralSettings = exports.updateShippingOrigin = exports.deleteBanner = exports.reorderBanners = exports.uploadBanners = exports.getBanners = exports.getSettings = exports.getShippingOrigin = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_shop_setting_service_1 = require("../services/admin.shop.setting.service");
const province_model_1 = require("../../../models/province.model");
const district_model_1 = require("../../../models/district.model");
const ward_model_1 = require("../../../models/ward.model");
const cloudinary_1 = require("../../../config/cloudinary");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
// GET /admin/settings/shipping-origin
exports.getShippingOrigin = (0, try_catch_1.TryCatch)(async (req, res) => {
    const origin = await admin_shop_setting_service_1.settingsService.getShippingOrigin();
    if (!origin) {
        return res.json({ data: null });
    }
    // Optionally: trả thêm name để FE hiển thị
    const [province, district, ward] = await Promise.all([
        province_model_1.Province.findOne({ code: origin.province_code }).lean(),
        district_model_1.District.findOne({ code: origin.district_code }).lean(),
        ward_model_1.Ward.findOne({ code: origin.ward_code }).lean(),
    ]);
    return res.json({
        data: {
            ...origin,
            province_name: province?.name || null,
            district_name: district?.name || null,
            ward_name: ward?.name || null,
        },
    });
});
// GET /admin/settings  -> full settings
exports.getSettings = (0, try_catch_1.TryCatch)(async (req, res) => {
    const settings = await admin_shop_setting_service_1.settingsService.getSettings();
    const obj = settings.toObject();
    let province_name = null;
    let district_name = null;
    let ward_name = null;
    if (obj.shipping_origin) {
        const { province_code, district_code, ward_code } = obj.shipping_origin;
        const [p, d, w] = await Promise.all([
            province_model_1.Province.findOne({ code: province_code }).lean(),
            district_model_1.District.findOne({ code: district_code }).lean(),
            ward_model_1.Ward.findOne({ code: ward_code }).lean(),
        ]);
        province_name = p?.name || null;
        district_name = d?.name || null;
        ward_name = w?.name || null;
    }
    return res.json({
        data: {
            ...obj,
            province_name,
            district_name,
            ward_name,
        },
    });
});
exports.getBanners = (0, try_catch_1.TryCatch)(async (req, res) => {
    const banners = await admin_shop_setting_service_1.settingsService.getBanners();
    return res.json({ data: { items: banners } });
});
// POST /admin/settings/banners  (multipart, field: banners)
exports.uploadBanners = (0, try_catch_1.TryCatch)(async (req, res) => {
    const files = (req.files || []);
    if (!files.length) {
        return res.status(400).json({ msg: "No files" });
    }
    const banners = await admin_shop_setting_service_1.settingsService.addBanners(files);
    return res.status(201).json({ data: { items: banners } });
});
// PATCH /admin/settings/banners/reorder
exports.reorderBanners = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { items } = req.body;
    const banners = await admin_shop_setting_service_1.settingsService.reorderBanners(items || []);
    return res.json({ data: { items: banners } });
});
// DELETE /admin/settings/banners/:bannerId
exports.deleteBanner = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { bannerId } = req.params;
    const banners = await admin_shop_setting_service_1.settingsService.deleteBanner(bannerId);
    return res.json({ data: { items: banners } });
});
// PUT /admin/settings/shipping-origin
exports.updateShippingOrigin = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { province_code, district_code, ward_code, address_line } = req.body;
    if (!province_code || !district_code || !ward_code || !address_line) {
        throw new app_errol_1.BadRequestException("province_code, district_code, ward_code, address_line are required");
    }
    // có thể validate xem code có hợp lệ không
    const [district, ward] = await Promise.all([
        district_model_1.District.findOne({ code: district_code, province_code }).lean(),
        ward_model_1.Ward.findOne({ code: ward_code, district_code }).lean(),
    ]);
    if (!district)
        throw new app_errol_1.BadRequestException("Invalid district_code or province_code");
    if (!ward)
        throw new app_errol_1.BadRequestException("Invalid ward_code or district_code");
    const origin = await admin_shop_setting_service_1.settingsService.updateShippingOrigin({
        province_code,
        district_code,
        ward_code,
        address_line,
    });
    return res.json({ data: origin });
});
// PUT /admin/settings/general  -> tên shop, email, logo
exports.updateGeneralSettings = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { shop_name, shop_email, shop_phone } = req.body;
    // file logo (optional)
    let logo_url;
    let logo_id;
    if (req.file) {
        const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "shop/logo");
        logo_url = secure_url;
        logo_id = public_id;
        // Xoá logo cũ nếu có
        const current = await admin_shop_setting_service_1.settingsService.getSettings();
        if (current.shop_logo_id && current.shop_logo_id !== public_id) {
            try {
                await cloudinary_1.cloudinaryClient.uploader.destroy(current.shop_logo_id);
            }
            catch (e) {
                console.error("Failed to delete old shop logo:", e);
            }
        }
    }
    const updated = await admin_shop_setting_service_1.settingsService.updateGeneralSettings({
        shop_name: shop_name ?? null,
        shop_email: shop_email ?? null,
        shop_phone: shop_phone ?? null,
        shop_logo_url: logo_url,
        shop_logo_id: logo_id,
    });
    return res.json({ data: updated });
});
exports.adminSettingsController = {
    getSettings: exports.getSettings,
    getShippingOrigin: exports.getShippingOrigin,
    updateShippingOrigin: exports.updateShippingOrigin,
    updateGeneralSettings: exports.updateGeneralSettings,
    getBanners: exports.getBanners,
    uploadBanners: exports.uploadBanners,
    reorderBanners: exports.reorderBanners,
    deleteBanner: exports.deleteBanner,
};
