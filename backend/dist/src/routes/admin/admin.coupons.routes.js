"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_COUPON_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_coupon_controller_1 = require("../../modules/admin/controllers/admin.coupon.controller");
const router = express_1.default.Router();
router.get("/", /*adminCoupon.list*/ admin_coupon_controller_1.adminCouponController.list);
router.post("/", /*validate(create),*/ /*adminCoupon.create*/ admin_coupon_controller_1.adminCouponController.create);
router.patch("/:id", /*validate(update),*/ /*adminCoupon.update*/ admin_coupon_controller_1.adminCouponController.update);
router.delete("/:id", /*adminCoupon.remove*/ admin_coupon_controller_1.adminCouponController.remove);
exports.ADMIN_COUPON_ROUTES = router;
