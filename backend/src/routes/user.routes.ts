import express, { Router } from "express";
// import { authMidleWares } from "../middleware/auth_middleware";
import { userController } from "../modules/client/controllers/user.controller";
import { authMidleWares } from "../middleware/authMiddleware";
import { uploadMiddlewares } from "../middleware/upload.middlewares";
// import { validate } from "../middleware/validate"; // nếu sau này bạn có
// import { updateMeSchema, changePasswordSchema } from "../validators/user.validator";

const router: Router = express.Router();

// Tất cả route user đều cần đăng nhập
router.use(authMidleWares.protectUserRoute);

router.get("/me",authMidleWares.protectUserRoute, userController.getMe);

router.patch(
    "/me",
    // validate(updateMeSchema),
    uploadMiddlewares.upload.single('file'),
    userController.updateMe
);

router.patch(
    "/me/password",
    // validate(changePasswordSchema),
    userController.changePassword
);
router.get("/me/coupons", userController.listMyCoupons);
// // user “lưu” coupon từ trang khuyến mãi
// POST /me/coupons/:couponId/save
// // list các coupon có thể dùng
// GET  /me/coupons?status=available
export const USER_ROUTES = router;
