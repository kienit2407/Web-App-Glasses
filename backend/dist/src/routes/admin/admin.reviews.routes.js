"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_REVIEWS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_review_controller_1 = require("../../modules/admin/controllers/admin.review.controller");
const router = express_1.default.Router();
router.get("/", /*adminReview.list*/ admin_review_controller_1.adminReviewController.list); // lọc theo product/user GET /admin/reviews?user_id=USER_ID GET /admin/reviews?user_id=USER_ID
router.delete("/:id", /*adminReview.remove*/ admin_review_controller_1.adminReviewController.remove); // moderation˝
exports.ADMIN_REVIEWS_ROUTES = router;
