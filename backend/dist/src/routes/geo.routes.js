"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEO_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const geo_controller_1 = require("../modules/client/controllers/geo.controller");
const router = express_1.default.Router();
router.get("/provinces", /*geo.provinces*/ geo_controller_1.geoController.provinces);
router.get("/districts", /*geo.districts*/ geo_controller_1.geoController.districts); // ?province_code
router.get("/wards", /*geo.wards*/ geo_controller_1.geoController.wards); // ?district_code˝
exports.GEO_ROUTES = router;
