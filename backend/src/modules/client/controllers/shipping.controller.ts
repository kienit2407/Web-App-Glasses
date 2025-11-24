// import { Request, Response } from "express";
// import { TryCatch } from "../../../utils/try_catch";
// import AppError, { BadRequestException } from "../../../utils/app_errol";
// import { shippingService } from "../services/shipping.serivce";
// import { ShopSettings } from "../../../models/shop.setting.model";
// import { District } from "../../../models/district.model";
// import { env } from "../../../config/environment";
// import axios from "axios";

// // POST /shipping/quote
// export const quote = TryCatch(async (req: Request, res: Response) => {
//     const {
//         district_code,
//         ward_code,
//         total_weight,
//         order_amount,
//     } = req.body;

//     if (!district_code || !ward_code) {
//         throw new BadRequestException("district_code and ward_code are required");
//     }

//     const result = await shippingService.quote({
//         district_code,
//         ward_code,
//         total_weight,
//         order_amount,
//     });

//     return res.json({ data: result });
// });
// export const availableServices = TryCatch(async (req: Request, res: Response) => {
//     const { district_code, ward_code, total_weight = 500, order_amount = 0 } = req.body;

//     if (!district_code || !ward_code) {
//         throw new BadRequestException("district_code and ward_code are required");
//     }

//     // lấy origin từ ShopSettings + map sang GHN id giống shippingService.quote
//     const shopSettings = await ShopSettings.findOne().lean();
//     if (!shopSettings || !shopSettings.shipping_origin) {
//         throw new AppError("Shop shipping origin is not configured", 500);
//     }
//     const origin = shopSettings.shipping_origin;

//     const originDistrict = await District.findOne({ code: origin.district_code, is_active: true }).lean();
//     const destDistrict = await District.findOne({ code: district_code, is_active: true }).lean();
//     if (!originDistrict || !destDistrict) {
//         throw new BadRequestException("Invalid district_code");
//     }

//     // gọi GHN available-services
//     const payload = {
//         shop_id: Number(env.SHOP_ID),
//         from_district: originDistrict.ghn_id,
//         to_district: destDistrict.ghn_id,
//     };
//     const ghnClient = axios.create({
//         baseURL: `${env.URL_API_GHN}/v2/shipping-order`,
//         headers: {
//             "Content-Type": "application/json",
//             token: env.TOKEN_API_GHN,
//         },
//     });
//     const ghnRes = await ghnClient.post("/available-services", payload);
//     const services = ghnRes.data?.data || [];

//     // tuỳ bạn: có thể map luôn speed + fee
//     // ví dụ: gọi lại shippingService.quote cho từng service_type_id để lấy fee
//     const result = [];
//     for (const s of services) {
//         const quote = await shippingService.quote({
//             district_code,
//             ward_code,
//             total_weight,
//             order_amount,
//             service_type_id: s.service_type_id,
//         });

//         result.push({
//             service_type_id: s.service_type_id,
//             short_name: s.short_name,
//             speed: s.service_type_id === 2 ? "standard" : "fast", // tạm map
//             fee: quote.shipping_fee,
//         });
//     }

//     return res.json({ data: result });
// });
// export const shippingController = {
//     quote,
//     availableServices
// };
