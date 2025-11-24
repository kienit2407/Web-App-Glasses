"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingService = void 0;
// src/modules/client/services/shipping.serivce.ts
const axios_1 = __importDefault(require("axios"));
const district_model_1 = require("../../../models/district.model");
const ward_model_1 = require("../../../models/ward.model");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
const environment_1 = require("../../../config/environment");
const shop_setting_model_1 = require("../../../models/shop.setting.model");
const GHN_API_URL = environment_1.env.URL_API_GHN;
const GHN_TOKEN = environment_1.env.TOKEN_API_GHN;
const GHN_DEFAULT_SERVICE_TYPE_ID = Number(environment_1.env.GHN_DEFAULT_SERVICE_TYPE_ID || 2);
const ghnClient = axios_1.default.create({
    baseURL: `${GHN_API_URL}/v2/shipping-order`,
    headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
    },
});
exports.shippingService = {
    async quote(params) {
        const { district_code, ward_code, total_weight = 500, order_amount = 0, } = params;
        if (!GHN_TOKEN) {
            throw new app_errol_1.default("Missing GHN token config", 500);
        }
        // 1. Lấy cấu hình điểm gửi hàng từ ShopSettings
        const shopSettings = await shop_setting_model_1.ShopSettings.findOne().lean();
        if (!shopSettings || !shopSettings.shipping_origin) {
            throw new app_errol_1.default("Shop shipping origin is not configured", 500);
        }
        const origin = shopSettings.shipping_origin;
        // 2. Map origin codes -> GHN id
        const originDistrict = await district_model_1.District.findOne({
            code: origin.district_code,
            is_active: true,
        }).lean();
        if (!originDistrict) {
            throw new app_errol_1.BadRequestException("Invalid shop origin district_code");
        }
        const originWard = await ward_model_1.Ward.findOne({
            code: origin.ward_code,
            is_active: true,
        }).lean();
        if (!originWard) {
            throw new app_errol_1.BadRequestException("Invalid shop origin ward_code");
        }
        // 3. Map destination codes -> GHN id
        const destDistrict = await district_model_1.District.findOne({
            code: district_code,
            is_active: true,
        }).lean();
        if (!destDistrict) {
            throw new app_errol_1.BadRequestException("Invalid district_code");
        }
        const destWard = await ward_model_1.Ward.findOne({
            code: ward_code,
            is_active: true,
        }).lean();
        if (!destWard) {
            throw new app_errol_1.BadRequestException("Invalid ward_code");
        }
        // 4. Luôn dùng service_type_id = GHN_DEFAULT_SERVICE_TYPE_ID (2)
        const svcTypeId = GHN_DEFAULT_SERVICE_TYPE_ID;
        // 5. Payload gọi GHN
        const payload = {
            from_district_id: originDistrict.ghn_id,
            from_ward_code: originWard.ghn_id,
            to_district_id: destDistrict.ghn_id,
            to_ward_code: destWard.ghn_id,
            service_type_id: svcTypeId,
            weight: total_weight,
            length: 20,
            width: 20,
            height: 10,
            insurance_value: order_amount,
            coupon: null,
        };
        try {
            console.log("GHN payload:", payload);
            const res = await ghnClient.post("/fee", payload);
            const data = res.data?.data;
            if (!data) {
                throw new Error("GHN response missing data");
            }
            console.log("GHN fee data:", data);
            return {
                shipping_fee: data.total,
                raw: data,
            };
        }
        catch (error) {
            console.error("GHN fee error raw:", error.response?.data);
            const status = error.response?.status;
            const message = error.response?.data?.message ||
                error.response?.statusText ||
                error.message ||
                "GHN fee error";
            console.error("GHN fee error:", status, message);
            throw new app_errol_1.BadRequestException(`Cannot get shipping fee: ${message}`);
        }
    },
};
