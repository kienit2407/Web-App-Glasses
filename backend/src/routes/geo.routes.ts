import express, { Router } from "express"
import { geoController } from "../modules/client/controllers/geo.controller"

const router: Router = express.Router()
router.get("/provinces", /*geo.provinces*/ geoController.provinces)
router.get("/districts", /*geo.districts*/ geoController.districts)   // ?province_code
router.get("/wards", /*geo.wards*/geoController.wards)           // ?district_code˝

export const GEO_ROUTES = router
