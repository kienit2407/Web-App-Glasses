// src/modules/client/services/shipping.serivce.ts
import axios from "axios";
import { District } from "../../../models/district.model";
import { Ward } from "../../../models/ward.model";
import AppError, { BadRequestException } from "../../../utils/app_errol";
import { env } from "../../../config/environment";
import { ShopSettings } from "../../../models/shop.setting.model";

const GHN_API_URL = env.URL_API_GHN;
const GHN_TOKEN = env.TOKEN_API_GHN;

const GHN_DEFAULT_SERVICE_TYPE_ID = Number(env.GHN_DEFAULT_SERVICE_TYPE_ID || 2);

const ghnClient = axios.create({
    baseURL: `${GHN_API_URL}/v2/shipping-order`,
    headers: {
        "Content-Type": "application/json",
        Token: GHN_TOKEN,
    },
});

interface QuoteParams {
    district_code: string;
    ward_code: string;
    total_weight?: number;  // gram
    order_amount?: number;  // dùng làm insurance_value
}

export const shippingService = {
    async quote(params: QuoteParams) {
        const {
            district_code,
            ward_code,
            total_weight = 500,
            order_amount = 0,
        } = params;

        if (!GHN_TOKEN) {
            throw new AppError("Missing GHN token config", 500);
        }

        // 1. Lấy cấu hình điểm gửi hàng từ ShopSettings
        const shopSettings = await ShopSettings.findOne().lean();
        if (!shopSettings || !shopSettings.shipping_origin) {
            throw new AppError("Shop shipping origin is not configured", 500);
        }

        const origin = shopSettings.shipping_origin;

        // 2. Map origin codes -> GHN id
        const originDistrict = await District.findOne({
            code: origin.district_code,
            is_active: true,
        }).lean();
        if (!originDistrict) {
            throw new BadRequestException("Invalid shop origin district_code");
        }

        const originWard = await Ward.findOne({
            code: origin.ward_code,
            is_active: true,
        }).lean();
        if (!originWard) {
            throw new BadRequestException("Invalid shop origin ward_code");
        }

        // 3. Map destination codes -> GHN id
        const destDistrict = await District.findOne({
            code: district_code,
            is_active: true,
        }).lean();
        if (!destDistrict) {
            throw new BadRequestException("Invalid district_code");
        }

        const destWard = await Ward.findOne({
            code: ward_code,
            is_active: true,
        }).lean();
        if (!destWard) {
            throw new BadRequestException("Invalid ward_code");
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
        } catch (error: any) {
            console.error("GHN fee error raw:", error.response?.data);

            const status = error.response?.status;
            const message =
                error.response?.data?.message ||
                error.response?.statusText ||
                error.message ||
                "GHN fee error";

            console.error("GHN fee error:", status, message);
            throw new BadRequestException(`Cannot get shipping fee: ${message}`);
        }
    },
};
