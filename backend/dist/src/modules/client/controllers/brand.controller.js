"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandController = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const brand_service_1 = require("../services/brand.service");
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { active } = req.query;
    const brands = await brand_service_1.brandService.listBrands({
        active: active === "1",
    });
    return res.json({ data: brands });
});
exports.brandController = {
    list: exports.list,
};
