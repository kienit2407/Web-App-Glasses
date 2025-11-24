import express, { Router } from "express"
import { adminReviewController } from "../../modules/admin/controllers/admin.review.controller"

const router: Router = express.Router()

router.get("/", /*adminReview.list*/ adminReviewController.list)          // lọc theo product/user GET /admin/reviews?user_id=USER_ID GET /admin/reviews?user_id=USER_ID
router.delete("/:id", /*adminReview.remove*/adminReviewController.remove)   // moderation˝
export const ADMIN_REVIEWS_ROUTES = router
