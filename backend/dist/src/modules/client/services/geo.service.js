"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoService = void 0;
// src/service/geo.service.ts
const province_model_1 = require("../../../models/province.model");
const district_model_1 = require("../../../models/district.model");
const ward_model_1 = require("../../../models/ward.model");
exports.geoService = {
    async listProvinces() {
        const provinces = await province_model_1.Province.find({ is_active: true })
            .sort({ name: 1 })
            .lean();
        // chỉ trả những gì FE cần
        return provinces.map((p) => ({
            code: p.code,
            name: p.name,
        }));
    },
    async listDistricts(province_code) {
        const districts = await district_model_1.District.find({
            province_code,
            is_active: true,
        })
            .sort({ name: 1 })
            .lean();
        return districts.map((d) => ({
            code: d.code,
            name: d.name,
            province_code: d.province_code,
        }));
    },
    async listWards(district_code) {
        const wards = await ward_model_1.Ward.find({
            district_code,
            is_active: true,
        })
            .sort({ name: 1 })
            .lean();
        return wards.map((w) => ({
            code: w.code,
            name: w.name,
            district_code: w.district_code,
        }));
    },
};
