import express, { Router } from "express"
import { adminBrandController } from "../../modules/admin/controllers/admin.brand.controller"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"

const router: Router = express.Router()

router.get("/", /*validate(create),*/ /*adminBrand.create*/adminBrandController.list)
router.post("/", /*validate(create),*/ /*adminBrand.create*/uploadMiddlewares.upload.single("logo"), adminBrandController.create)
router.patch("/:id", /*validate(update),*/ /*adminBrand.update*/uploadMiddlewares.upload.single("logo"), adminBrandController.update)
router.delete("/:id", /*adminBrand.remove*/adminBrandController.remove) // xoá mềm k xoá cứng
export const ADMIN_BRANDS_ROUTES = router

