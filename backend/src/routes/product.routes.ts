import express, { Router } from "express"
import { productController } from "../modules/client/controllers/product.controller"
import { authMidleWares } from "../middleware/authMiddleware"

const router: Router = express.Router()
router.get("/search-suggest", productController.getSearchSuggestions)
router.get("/", productController.getProducts)      
router.get("/:productId", /*product.detail*/productController.getProductDetail)


// router.get("/:productId/variants", /*product.listVariants*/)
// router.get("/:productId/variants/:variantId/images", /*product.listVariantImages*/)

export const PRODUCT_ROUTES = router
// GET /products?q=&categories=&brands=&minPrice=&maxPrice=&sort=&page=&limit=