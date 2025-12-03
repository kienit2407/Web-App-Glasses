import express, { Router } from "express";
import { geoController } from "../modules/client/controllers/geo.controller";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Client - Geo
 *     description: Địa lý (tỉnh / huyện / xã) dùng cho địa chỉ
 */

/**
 * @swagger
 * /geo/provinces:
 *   get:
 *     summary: Danh sách tỉnh/thành
 *     tags: [Client - Geo]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/provinces", geoController.provinces);

/**
 * @swagger
 * /geo/districts:
 *   get:
 *     summary: Danh sách quận/huyện theo province_code
 *     tags: [Client - Geo]
 *     parameters:
 *       - in: query
 *         name: province_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/districts", geoController.districts);

/**
 * @swagger
 * /geo/wards:
 *   get:
 *     summary: Danh sách phường/xã theo district_code
 *     tags: [Client - Geo]
 *     parameters:
 *       - in: query
 *         name: district_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/wards", geoController.wards);

export const GEO_ROUTES = router;
