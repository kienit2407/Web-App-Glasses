"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopSettings = void 0;
const mongoose_1 = require("mongoose");
const ShippingOriginSchema = new mongoose_1.Schema({
    province_code: { type: String, required: true, trim: true },
    district_code: { type: String, required: true, trim: true },
    ward_code: { type: String, required: true, trim: true },
    address_line: { type: String, required: true, trim: true },
}, { _id: false });
const BannerSchema = new mongoose_1.Schema({
    banner_url: { type: String, required: true },
    banner_id: { type: String, required: true },
    position: { type: Number, required: true },
}, { _id: true });
exports.ShopSettings = (0, mongoose_1.model)('shop_setting', new mongoose_1.Schema({
    shop_name: { type: String, default: null, trim: true },
    shop_email: { type: String, default: null, trim: true },
    shop_phone: { type: String, default: null, trim: true },
    shop_logo_url: { type: String, default: null },
    banner_list: { type: [BannerSchema], default: [] },
    shop_logo_id: { type: String, default: null },
    shipping_origin: { type: ShippingOriginSchema, default: null },
}, { timestamps: true }));
