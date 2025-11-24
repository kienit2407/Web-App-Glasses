
import express, { Router } from "express"
import { categoryController } from "../modules/client/controllers/category.controller"

const router : Router  = express.Router()
router.get("/", /*cat.list*/categoryController.listCategories)             // ?tree=1, ?active=1
// router.get("/:catId", /*cat.detail*/)

export const CARTEGORY_ROUTES = router
    