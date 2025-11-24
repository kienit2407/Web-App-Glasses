import express, { Router } from "express"
import { adminCouponController } from "../../modules/admin/controllers/admin.coupon.controller"

const router: Router = express.Router()

router.get("/", /*adminCoupon.list*/adminCouponController.list)
router.post("/", /*validate(create),*/ /*adminCoupon.create*/adminCouponController.create)
router.patch("/:id", /*validate(update),*/ /*adminCoupon.update*/adminCouponController.update)
router.delete("/:id", /*adminCoupon.remove*/adminCouponController.remove)
export const ADMIN_COUPON_ROUTES = router

