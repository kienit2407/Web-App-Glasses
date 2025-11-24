"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
// import { authMidleWares } from "../middleware/auth_middleware";
const user_controller_1 = require("../modules/client/controllers/user.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
// import { validate } from "../middleware/validate"; // nếu sau này bạn có
// import { updateMeSchema, changePasswordSchema } from "../validators/user.validator";
const router = express_1.default.Router();
// Tất cả route user đều cần đăng nhập
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/me", authMiddleware_1.authMidleWares.protectUserRoute, user_controller_1.userController.getMe);
router.patch("/me", 
// validate(updateMeSchema),
upload_middlewares_1.uploadMiddlewares.upload.single('file'), user_controller_1.userController.updateMe);
router.patch("/me/password", 
// validate(changePasswordSchema),
user_controller_1.userController.changePassword);
router.get("/me/coupons", user_controller_1.userController.listMyCoupons);
// // user “lưu” coupon từ trang khuyến mãi
// POST /me/coupons/:couponId/save
// // list các coupon có thể dùng
// GET  /me/coupons?status=available
exports.USER_ROUTES = router;
