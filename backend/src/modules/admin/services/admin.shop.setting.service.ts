import { cloudinaryClient } from "../../../config/cloudinary";
import { IBannerImage, IShippingOrigin, ShopSettings } from "../../../models/shop.setting.model";
import { uploadImageBuffer } from "../../../utils/cloudinary.helper";

export const settingsService = {
    async getSettings() {
        let settings = await ShopSettings.findOne();
        if (!settings) {
            settings = await new ShopSettings({}).save();
        }
        return settings;
    },

    async getFullSettings() {
        const settings = await this.getSettings();
        const obj = settings.toObject();

        // sort banner theo position cho chắc
        obj.banner_list = (obj.banner_list || []).sort(
            (a: IBannerImage, b: IBannerImage) => a.position - b.position
        );

        return obj;
    },
    // Dùng cho AdminSettings / FE user
    async getShippingOrigin(): Promise<IShippingOrigin | null> {
        const settings = await this.getSettings() // Giờ đây 'settings' là IShopSettings (không null)
        return settings.shipping_origin || null;
    },
    async addBanners(files: Express.Multer.File[]) {
        if (!files || files.length === 0) return [];

        const settings = await this.getSettings();

        const currentBanners = settings.banner_list || [];
        let nextPos =
            currentBanners.length > 0
                ? Math.max(...currentBanners.map((b) => b.position)) + 1
                : 0;

        const uploaded: IBannerImage[] = [];

        for (const file of files) {
            const { secure_url, public_id } = await uploadImageBuffer(
                file.buffer,
                "shop/banners"
            );

            uploaded.push({
                banner_url: secure_url,
                banner_id: public_id,
                position: nextPos++,
            });
        }

        settings.banner_list = [...currentBanners, ...uploaded];
        await settings.save();

        return settings.banner_list.sort((a, b) => a.position - b.position);
    },

    async getBanners() {
        const settings = await this.getSettings();
        return (settings.banner_list || []).sort(
            (a, b) => a.position - b.position
        );
    },

    async deleteBanner(bannerMongoId: string) {
        const settings = await this.getSettings();

        const banner = settings.banner_list.find(
            (b) => String(b._id) === String(bannerMongoId)
        );
        if (!banner) return;

        // xoá cloudinary
        if (banner.banner_id) {
            try {
                await cloudinaryClient.uploader.destroy(banner.banner_id);
            } catch (e) {
                console.error("Failed to delete banner from cloudinary", e);
            }
        }

        settings.banner_list = settings.banner_list.filter(
            (b) => String(b._id) !== String(bannerMongoId)
        );

        // normalize lại position 0..n-1
        settings.banner_list = settings.banner_list
            .sort((a, b) => a.position - b.position)
            .map((b, idx) => {
                b.position = idx;
                return b;
            });

        await settings.save();
        return settings.banner_list;
    },

    async reorderBanners(items: { banner_id: string; position: number }[]) {
        const settings = await this.getSettings();
        const list = settings.banner_list || [];

        // gán position mới
        for (const item of items) {
            const banner = list.find((b) => String(b._id) === String(item.banner_id));
            if (banner) {
                banner.position = item.position;
            }
        }

        settings.banner_list = list
            .sort((a, b) => a.position - b.position)
            .map((b, idx) => {
                b.position = idx;
                return b;
            });

        await settings.save();
        return settings.banner_list;
    },
    async updateShippingOrigin(payload: IShippingOrigin) {
        const settings = await ShopSettings.findOneAndUpdate(
            {},
            { $set: { shipping_origin: payload } },
            { new: true, upsert: true }
        ).lean();

        return settings?.shipping_origin || null;
    },
    async updateGeneralSettings(payload: {
        shop_name?: string | null;
        shop_email?: string | null;
        shop_logo_url?: string | null;
        shop_logo_id?: string | null;
        shop_phone?: string | null;
    }) {
        const settings = await ShopSettings.findOneAndUpdate(
            {},
            {
                $set: {
                    ...(payload.shop_name !== undefined && { shop_name: payload.shop_name }),
                    ...(payload.shop_email !== undefined && { shop_email: payload.shop_email }),
                    ...(payload.shop_logo_url !== undefined && { shop_logo_url: payload.shop_logo_url }),
                    ...(payload.shop_logo_id !== undefined && { shop_logo_id: payload.shop_logo_id }),
                    ...(payload.shop_phone !== undefined && { shop_phone: payload.shop_phone }),
                },
            },
            { new: true, upsert: true }
        ).lean();

        return settings;
    },
};
