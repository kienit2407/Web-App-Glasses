import express, { Router } from "express"
import { adminCategoryController } from "../../modules/admin/controllers/admin.category.controller"

const router : Router  = express.Router()

router.get ("/", /*validate(create),*/ /*adminCat.create*/adminCategoryController.list)
router.post  ("/", /*validate(create),*/ /*adminCat.create*/adminCategoryController.create)
router.patch ("/:id", /*validate(update),*/ /*adminCat.update*/adminCategoryController.update)
router.delete("/:id", /*adminCat.remove*/adminCategoryController.remove)
export const ADMIN_CATEGORIES_ROUTES = router

