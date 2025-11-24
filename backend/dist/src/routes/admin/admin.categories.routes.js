"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_CATEGORIES_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_category_controller_1 = require("../../modules/admin/controllers/admin.category.controller");
const router = express_1.default.Router();
router.get("/", /*validate(create),*/ /*adminCat.create*/ admin_category_controller_1.adminCategoryController.list);
router.post("/", /*validate(create),*/ /*adminCat.create*/ admin_category_controller_1.adminCategoryController.create);
router.patch("/:id", /*validate(update),*/ /*adminCat.update*/ admin_category_controller_1.adminCategoryController.update);
router.delete("/:id", /*adminCat.remove*/ admin_category_controller_1.adminCategoryController.remove);
exports.ADMIN_CATEGORIES_ROUTES = router;
