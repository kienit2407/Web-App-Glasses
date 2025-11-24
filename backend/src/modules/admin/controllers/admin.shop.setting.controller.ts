import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { settingsService } from "../services/admin.shop.setting.service";
import { Province } from "../../../models/province.model";
import { District } from "../../../models/district.model";
import { Ward } from "../../../models/ward.model";
import { cloudinaryClient } from "../../../config/cloudinary";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";

// GET /admin/settings/shipping-origin
export const getShippingOrigin = TryCatch(async (req: Request, res: Response) => {
    const origin = await settingsService.getShippingOrigin();

    if (!origin) {
        return res.json({ data: null });
    }

    // Optionally: trả thêm name để FE hiển thị
    const [province, district, ward] = await Promise.all([
        Province.findOne({ code: origin.province_code }).lean(),
        District.findOne({ code: origin.district_code }).lean(),
        Ward.findOne({ code: origin.ward_code }).lean(),
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
export const getSettings = TryCatch(async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings();
    const obj = settings.toObject();

    let province_name: string | null = null;
    let district_name: string | null = null;
    let ward_name: string | null = null;

    if (obj.shipping_origin) {
        const { province_code, district_code, ward_code } = obj.shipping_origin;
        const [p, d, w] = await Promise.all([
            Province.findOne({ code: province_code }).lean(),
            District.findOne({ code: district_code }).lean(),
            Ward.findOne({ code: ward_code }).lean(),
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
export const getBanners = TryCatch(async (req: Request, res: Response) => {
    const banners = await settingsService.getBanners();
    return res.json({ data: { items: banners } });
});

// POST /admin/settings/banners  (multipart, field: banners)
export const uploadBanners = TryCatch(async (req: Request, res: Response) => {
    const files = (req.files || []) as Express.Multer.File[];
    if (!files.length) {
        return res.status(400).json({ msg: "No files" });
    }
    const banners = await settingsService.addBanners(files);
    return res.status(201).json({ data: { items: banners } });
});

// PATCH /admin/settings/banners/reorder
export const reorderBanners = TryCatch(async (req: Request, res: Response) => {
    const { items } = req.body as { items: { banner_id: string; position: number }[] };
    const banners = await settingsService.reorderBanners(items || []);
    return res.json({ data: { items: banners } });
});

// DELETE /admin/settings/banners/:bannerId
export const deleteBanner = TryCatch(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const banners = await settingsService.deleteBanner(bannerId);
    return res.json({ data: { items: banners } });
});
// PUT /admin/settings/shipping-origin
export const updateShippingOrigin = TryCatch(async (req: Request, res: Response) => {
    const { province_code, district_code, ward_code, address_line } = req.body;

    if (!province_code || !district_code || !ward_code || !address_line) {
        throw new BadRequestException("province_code, district_code, ward_code, address_line are required");
    }

    // có thể validate xem code có hợp lệ không
    const [district, ward] = await Promise.all([
        District.findOne({ code: district_code, province_code }).lean(),
        Ward.findOne({ code: ward_code, district_code }).lean(),
    ]);

    if (!district) throw new BadRequestException("Invalid district_code or province_code");
    if (!ward) throw new BadRequestException("Invalid ward_code or district_code");

    const origin = await settingsService.updateShippingOrigin({
        province_code,
        district_code,
        ward_code,
        address_line,
    });

    return res.json({ data: origin });
});
// PUT /admin/settings/general  -> tên shop, email, logo
export const updateGeneralSettings = TryCatch(async (req: Request, res: Response) => {
    const { shop_name, shop_email, shop_phone } = req.body;

    // file logo (optional)
    let logo_url: string | undefined;
    let logo_id: string | undefined;

    if (req.file) {
        const { secure_url, public_id } = await uploadImageBuffer(
            req.file.buffer,
            "shop/logo"
        );
        logo_url = secure_url;
        logo_id = public_id;

        // Xoá logo cũ nếu có
        const current = await settingsService.getSettings();
        if (current.shop_logo_id && current.shop_logo_id !== public_id) {
            try {
                await cloudinaryClient.uploader.destroy(current.shop_logo_id);
            } catch (e) {
                console.error("Failed to delete old shop logo:", e);
            }
        }
    }

    const updated = await settingsService.updateGeneralSettings({
        shop_name: shop_name ?? null,
        shop_email: shop_email ?? null,
        shop_phone: shop_phone ?? null,
        shop_logo_url: logo_url,
        shop_logo_id: logo_id,
    });

    return res.json({ data: updated });
});
export const adminSettingsController = {
    getSettings,
    getShippingOrigin,
    updateShippingOrigin,
    updateGeneralSettings,
    getBanners,
    uploadBanners,
    reorderBanners,
    deleteBanner,
};
