
import express, { Router } from "express"
import { brandController } from "../modules/client/controllers/brand.controller"

const router: Router = express.Router()

router.get("/", /*brand.list*/brandController.list)              // ?active=1
// router.get("/:id", /*brand.detail*/)

export const BRAND_ROUTES = router
