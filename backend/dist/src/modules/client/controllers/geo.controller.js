"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoController = exports.wards = exports.districts = exports.provinces = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const geo_service_1 = require("../services/geo.service");
// GET /geo/provinces
exports.provinces = (0, try_catch_1.TryCatch)(async (req, res) => {
    const data = await geo_service_1.geoService.listProvinces();
    return res.json({ data });
});
// GET /geo/districts?province_code=...
exports.districts = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { province_code } = req.query;
    if (!province_code || typeof province_code !== "string") {
        throw new app_errol_1.BadRequestException("province_code is required");
    }
    const data = await geo_service_1.geoService.listDistricts(province_code);
    return res.json({ data });
});
// GET /geo/wards?district_code=...
exports.wards = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { district_code } = req.query;
    if (!district_code || typeof district_code !== "string") {
        throw new app_errol_1.BadRequestException("district_code is required");
    }
    const data = await geo_service_1.geoService.listWards(district_code);
    return res.json({ data });
});
exports.geoController = {
    provinces: exports.provinces,
    districts: exports.districts,
    wards: exports.wards,
};
