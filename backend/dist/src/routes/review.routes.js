"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../modules/client/controllers/review.controller");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/of/:productId", review_controller_1.reviewController.listOfProduct);
// Bắt đầu áp dụng middleware xác thực cho TẤT CẢ các route bên dưới
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// 2. Các route CẦN Auth
router.post("/", upload_middlewares_1.uploadMiddlewares.upload.fields([ /* ... */]), review_controller_1.reviewController.create);
router.patch("/:id", upload_middlewares_1.uploadMiddlewares.upload.fields([ /* ... */]), review_controller_1.reviewController.update);
router.delete("/:id", review_controller_1.reviewController.remove);
// router.get("/of/:productId", /*review.listOfProduct*/reviewController.listOfProduct) // ?page&limit
// router.post("/", /*requireAuth,*/ /*validate(createReview),*/ /*review.create*/reviewController.create)
// router.patch("/:id", /*requireAuth,*/ /*review.update*/reviewController.update)
// router.delete("/:id", /*requireAuth,*/ /*review.remove*/reviewController.remove)
exports.REVIEW_ROUTES = router;
