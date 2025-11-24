"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.getProductDetail = void 0;
const product_service_1 = require("../services/product.service");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const getProducts = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { q, categories, brands, minPrice, maxPrice, sort, page, limit, gender, shape,
    // type: frame | sunglasses (FE tự map sang categories, BE không cần xử lý)
     } = req.query;
    const result = await product_service_1.productService.getPublicProducts({
        q: q,
        categories: categories
            ? String(categories).split(",").filter(Boolean)
            : undefined,
        brands: brands ? String(brands).split(",").filter(Boolean) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sort,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        gender: gender,
        shape: shape,
    });
    return res.json({
        data: result.items,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
        },
    });
});
exports.getProductDetail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { productId } = req.params;
    if (!productId)
        throw new app_errol_1.BadRequestException("Missing productId");
    const data = await product_service_1.productService.getProductDetail(productId);
    if (!data)
        throw new app_errol_1.NotFoundException("Product not found");
    return res.json({ data });
});
exports.productController = {
    getProducts,
    getProductDetail: exports.getProductDetail
};
