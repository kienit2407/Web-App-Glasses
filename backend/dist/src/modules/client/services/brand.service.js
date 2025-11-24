"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandService = void 0;
const brands_model_1 = require("../../../models/brands.model");
exports.brandService = {
    async listBrands(options) {
        const filter = {};
        if (options.active) {
            filter.is_active = true;
        }
        const brands = await brands_model_1.Brand.find(filter)
            .sort({ brand_name: 1 })
            .lean();
        return brands;
    },
};
