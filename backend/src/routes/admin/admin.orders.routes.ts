import express, { Router } from "express"
import { adminOrderController } from "../../modules/admin/controllers/admin.order.controller"
import { authMidleWares } from "../../middleware/authMiddleware"

const router: Router = express.Router()
router.use(authMidleWares.protectUserRoute)
router.get("/", /*adminOrder.search*/adminOrderController.search)            // filter: status, date, user, code
router.get("/:id", /*adminOrder.detail*/adminOrderController.detail)
router.patch("/:id/status", /*adminOrder.updateStatus*/adminOrderController.updateStatus) // pending→processing→shipping→...
export const ADMIN_ORDERS_ROUTES = router
