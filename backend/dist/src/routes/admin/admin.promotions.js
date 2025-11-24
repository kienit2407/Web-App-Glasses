"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PROMOTIONS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_promotion_controller_1 = require("../../modules/admin/controllers/admin.promotion.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = express_1.default.Router();
router.get("/", /*adminPromo.list*/ admin_promotion_controller_1.adminPromotionController.list);
router.post("/", /*validate(create),*/ /*adminPromo.create*/ upload_middlewares_1.uploadMiddlewares.upload.single("banner"), admin_promotion_controller_1.adminPromotionController.create);
router.patch("/:id", /*validate(update),*/ /*adminPromo.update*/ upload_middlewares_1.uploadMiddlewares.upload.single("banner"), admin_promotion_controller_1.adminPromotionController.update);
router.delete("/:id", /*adminPromo.remove*/ admin_promotion_controller_1.adminPromotionController.remove);
// GET /admin/promotions/665f1b.../relations id của promotion
router.get("/:id/relations", admin_promotion_controller_1.adminPromotionController.relations);
// link coupons/brands/products
router.post("/:id/coupons/:couponId", /*adminPromo.linkCoupon*/ admin_promotion_controller_1.adminPromotionController.linkCoupon);
router.delete("/:id/coupons/:couponId", /*adminPromo.unlinkCoupon*/ admin_promotion_controller_1.adminPromotionController.unlinkCoupon);
router.post("/:id/brands/:brandId", /*adminPromo.linkBrand*/ admin_promotion_controller_1.adminPromotionController.linkBrand);
router.delete("/:id/brands/:brandId", /*adminPromo.unlinkBrand*/ admin_promotion_controller_1.adminPromotionController.unlinkBrand);
router.post("/:id/products/:productId", /*adminPromo.linkProduct*/ admin_promotion_controller_1.adminPromotionController.linkProduct);
router.delete("/:id/products/:productId", /*adminPromo.unlinkProduct*/ admin_promotion_controller_1.adminPromotionController.unlinkProduct);
exports.ADMIN_PROMOTIONS_ROUTES = router;
