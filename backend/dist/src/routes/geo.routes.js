"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEO_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const geo_controller_1 = require("../modules/client/controllers/geo.controller");
const router = express_1.default.Router();
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
router.get("/provinces", geo_controller_1.geoController.provinces);
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
router.get("/districts", geo_controller_1.geoController.districts);
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
router.get("/wards", geo_controller_1.geoController.wards);
exports.GEO_ROUTES = router;
