import { Schema, model, Document, Types } from "mongoose";

export interface IShippingOrigin {
    province_code: string;
    district_code: string;
    ward_code: string;
    address_line: string;
}
export interface IBannerImage {
    _id?: Types.ObjectId;          // subdocument _id
    banner_url: string;
    banner_id: string;             // public_id Cloudinary
    position: number;
}
export interface IShopSettings extends Document {
    shop_name?: string | null;
    shop_email?: string | null;
    shop_logo_url?: string | null;
    shop_logo_id?: string | null;
    shop_phone: string | null
    banner_list: Array<IBannerImage>
    // sau này có thể thêm nhiều config khác
    shipping_origin?: IShippingOrigin | null;
    createdAt: Date;
    updatedAt: Date;
}
const ShippingOriginSchema = new Schema<IShippingOrigin>(
    {
        province_code: { type: String, required: true, trim: true },
        district_code: { type: String, required: true, trim: true },
        ward_code: { type: String, required: true, trim: true },
        address_line: { type: String, required: true, trim: true },
    },
    { _id: false }
);
const BannerSchema = new Schema<IBannerImage>(
    {
        banner_url: { type: String, required: true },
        banner_id: { type: String, required: true },
        position: { type: Number, required: true },
    },
    { _id: true }
);
export const ShopSettings = model<IShopSettings>('shop_setting', new Schema<IShopSettings>({
    shop_name: { type: String, default: null, trim: true },
    shop_email: { type: String, default: null, trim: true },
    shop_phone: { type: String, default: null, trim: true },
    shop_logo_url: { type: String, default: null },
    banner_list: { type: [BannerSchema], default: [] },
    shop_logo_id: { type: String, default: null },
    shipping_origin: { type: ShippingOriginSchema, default: null },
}, { timestamps: true }))