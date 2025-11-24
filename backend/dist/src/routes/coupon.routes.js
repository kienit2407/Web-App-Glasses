"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUPON_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const coupon_controller_1 = require("../modules/client/controllers/coupon.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// Coupon Center
router.get("/", coupon_controller_1.couponController.listAvailable);
router.get("/:code/check", /*coupon.check*/ coupon_controller_1.couponController.check);
router.post("/claim/:code", /*/*requireAuth,*/ /*coupon.claim*/ coupon_controller_1.couponController.claim);
exports.COUPON_ROUTES = router;
