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
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/of/:productId", review_controller_1.reviewController.listOfProduct);
// tạo review: tối đa 5 ảnh + 1 video
router.post("/", 
// requireAuth,
upload_middlewares_1.uploadMiddlewares.upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
]), review_controller_1.reviewController.create);
// sửa review: cho phép chỉnh rating/comment, sau này nếu muốn sửa media thì cũng dùng fields giống trên
router.patch("/:id", 
// requireAuth,
upload_middlewares_1.uploadMiddlewares.upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
]), review_controller_1.reviewController.update);
router.delete("/:id", 
// requireAuth,
review_controller_1.reviewController.remove);
// router.get("/of/:productId", /*review.listOfProduct*/reviewController.listOfProduct) // ?page&limit
// router.post("/", /*requireAuth,*/ /*validate(createReview),*/ /*review.create*/reviewController.create)
// router.patch("/:id", /*requireAuth,*/ /*review.update*/reviewController.update)
// router.delete("/:id", /*requireAuth,*/ /*review.remove*/reviewController.remove)
exports.REVIEW_ROUTES = router;
