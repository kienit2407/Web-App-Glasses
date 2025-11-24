
import express, { Router } from "express"
import { cartController } from "../modules/client/controllers/cart.controller"
import { authMidleWares } from "../middleware/authMiddleware"

const router: Router = express.Router()

router.use(authMidleWares.protectUserRoute)

router.get("/", cartController.getMyCart)          // lấy giỏ hàng
router.post("/add-item", cartController.addItem)   // thêm sản phẩm
router.patch("/update/:itemId", cartController.updateItem)
router.delete("/remove/:itemId", cartController.removeItem)

// router.get("/", cartController.addItem) // lấy giỏ hàng hiện tại
// router.post("/addItem", /*validate(addItem)*/cartController.addItem) // têm sản phẩm vào giỏ hàng
// router.patch("/update/:itemId", /*validate(updateItem),*/ /*cart.updateItem*/cartController.updateItem)
// router.delete("/remove/:itemId", cartController.removeItem)

export const CART_ROUTES = router
