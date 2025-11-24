import express, { Router } from "express"
import { reviewController } from "../modules/client/controllers/review.controller"
import { uploadMiddlewares } from "../middleware/upload.middlewares";
import { authMidleWares } from "../middleware/authMiddleware";

const router: Router = express.Router()

router.get(
    "/of/:productId",
    reviewController.listOfProduct
);

// Bắt đầu áp dụng middleware xác thực cho TẤT CẢ các route bên dưới
router.use(authMidleWares.protectUserRoute)

// 2. Các route CẦN Auth
router.post(
    "/",
    uploadMiddlewares.upload.fields([ /* ... */]),
    reviewController.create
);

router.patch(
    "/:id",
    uploadMiddlewares.upload.fields([ /* ... */]),
    reviewController.update
);

router.delete(
    "/:id",
    reviewController.remove
);

// router.get("/of/:productId", /*review.listOfProduct*/reviewController.listOfProduct) // ?page&limit
// router.post("/", /*requireAuth,*/ /*validate(createReview),*/ /*review.create*/reviewController.create)
// router.patch("/:id", /*requireAuth,*/ /*review.update*/reviewController.update)
// router.delete("/:id", /*requireAuth,*/ /*review.remove*/reviewController.remove)

export const REVIEW_ROUTES = router

