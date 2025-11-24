"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_BRANDS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_brand_controller_1 = require("../../modules/admin/controllers/admin.brand.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = express_1.default.Router();
router.get("/", /*validate(create),*/ /*adminBrand.create*/ admin_brand_controller_1.adminBrandController.list);
router.post("/", /*validate(create),*/ /*adminBrand.create*/ upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_brand_controller_1.adminBrandController.create);
router.patch("/:id", /*validate(update),*/ /*adminBrand.update*/ upload_middlewares_1.uploadMiddlewares.upload.single("logo"), admin_brand_controller_1.adminBrandController.update);
router.delete("/:id", /*adminBrand.remove*/ admin_brand_controller_1.adminBrandController.remove); // xoá mềm k xoá cứng
exports.ADMIN_BRANDS_ROUTES = router;
