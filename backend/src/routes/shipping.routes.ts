//tính phí 
import express, { Router } from "express"
import { authMidleWares } from "../middleware/authMiddleware"

const router: Router = express.Router()
router.use(authMidleWares.protectUserRoute)

// router.post("/quote", /*/*requireAuth,*/ /*validate(quoteSchema),*/ /*ship.quote*/shippingController.quote)
// router.post("/available-services", shippingController.availableServices);
export const SHIPPING_ROUTES = router
