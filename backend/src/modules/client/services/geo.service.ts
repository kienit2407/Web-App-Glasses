// src/service/geo.service.ts
import { Province } from "../../../models/province.model";
import { District } from "../../../models/district.model";
import { Ward } from "../../../models/ward.model";

export const geoService = {
    async listProvinces() {
        const provinces = await Province.find({ is_active: true })
            .sort({ name: 1 })
            .lean();

        // chỉ trả những gì FE cần
        return provinces.map((p) => ({
            code: p.code,
            name: p.name,
        }));
    },

    async listDistricts(province_code: string) {
        const districts = await District.find({
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

    async listWards(district_code: string) {
        const wards = await Ward.find({
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
    async getAddressDetails(pCode: string, dCode: string, wCode: string) {
        // Chạy song song 3 câu lệnh findOne để tiết kiệm thời gian
        const [province, district, ward] = await Promise.all([
            Province.findOne({ code: pCode, is_active: true }).select("name").lean(),
            District.findOne({ code: dCode, is_active: true }).select("name").lean(),
            Ward.findOne({ code: wCode, is_active: true }).select("name").lean(),
        ]);

        const pName = province?.name || "";
        const dName = district?.name || "";
        const wName = ward?.name || "";

        return {
            province_name: pName,
            district_name: dName,
            ward_name: wName,
            full_location: [wName, dName, pName].filter(Boolean).join(", "),
        };
    }
};
