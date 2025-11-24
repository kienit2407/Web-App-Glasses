"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../modules/client/controllers/product.controller");
const router = express_1.default.Router();
router.get("/", product_controller_1.productController.getProducts);
router.get("/:productId", /*product.detail*/ product_controller_1.productController.getProductDetail);
// router.get("/:productId/variants", /*product.listVariants*/)
// router.get("/:productId/variants/:variantId/images", /*product.listVariantImages*/)
exports.PRODUCT_ROUTES = router;
// GET /products?q=&categories=&brands=&minPrice=&maxPrice=&sort=&page=&limit=
