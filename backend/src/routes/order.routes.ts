import express, { Router } from "express"
import { authMidleWares } from "../middleware/authMiddleware"
import { orderController } from "../modules/client/controllers/order.controller"

const router: Router = express.Router()
router.use(authMidleWares.protectUserRoute)
router.post("/", /*validate(createOrder),*/ /*order.create*/orderController.create)   // snapshot address, items, coupon
router.get ("/", /*order.listMy*/orderController.listMy)                              // ?status&page&limit
router.get ("/:id", /*order.detailMy*/orderController.detailMy)
router.patch("/:id/cancel", /*order.cancelMy*/orderController.cancelMy)
router.post("/:id/reorder", orderController.reorderMy)
// NEW:
router.patch("/:id/confirm-delivered", orderController.confirmDeliveredMy)
router.patch("/:id/request-return", orderController.requestReturnMy)
export const ORDER_ROUTES = router
