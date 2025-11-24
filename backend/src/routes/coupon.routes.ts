import express, { Router } from "express"
import { couponController } from "../modules/client/controllers/coupon.controller"
import { authMidleWares } from "../middleware/authMiddleware"

const router: Router = express.Router()
router.use(authMidleWares.protectUserRoute)
// Coupon Center
router.get("/", couponController.listAvailable);

router.get("/:code/check", /*coupon.check*/couponController.check)
router.post("/claim/:code", /*/*requireAuth,*/ /*coupon.claim*/couponController.claim)

export const COUPON_ROUTES = router
