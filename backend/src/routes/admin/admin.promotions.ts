import express, { Router } from "express"
import { adminPromotionController } from "../../modules/admin/controllers/admin.promotion.controller"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"

const router: Router = express.Router()
router.get("/", /*adminPromo.list*/adminPromotionController.list)
router.post("/", /*validate(create),*/ /*adminPromo.create*/uploadMiddlewares.upload.single("banner"), adminPromotionController.create)
router.patch("/:id", /*validate(update),*/ /*adminPromo.update*/uploadMiddlewares.upload.single("banner"), adminPromotionController.update)
router.delete("/:id", /*adminPromo.remove*/adminPromotionController.remove)
// GET /admin/promotions/665f1b.../relations id của promotion
router.get("/:id/relations", adminPromotionController.relations);
// link coupons/brands/products
router.post("/:id/coupons/:couponId", /*adminPromo.linkCoupon*/adminPromotionController.linkCoupon)
router.delete("/:id/coupons/:couponId", /*adminPromo.unlinkCoupon*/adminPromotionController.unlinkCoupon)
router.post("/:id/brands/:brandId", /*adminPromo.linkBrand*/adminPromotionController.linkBrand)
router.delete("/:id/brands/:brandId", /*adminPromo.unlinkBrand*/adminPromotionController.unlinkBrand)
router.post("/:id/products/:productId", /*adminPromo.linkProduct*/adminPromotionController.linkProduct)
router.delete("/:id/products/:productId", /*adminPromo.unlinkProduct*/adminPromotionController.unlinkProduct)

export const ADMIN_PROMOTIONS_ROUTES = router