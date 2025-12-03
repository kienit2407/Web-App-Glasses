"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const brand_controller_1 = require("../modules/client/controllers/brand.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Client - Brands
 *     description: Danh sách thương hiệu
 */
/**
 * @swagger
 * /catalog/brands:
 *   get:
 *     summary: Lấy danh sách brand (có thể filter active=1)
 *     tags: [Client - Brands]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: integer
 *         description: 1 = chỉ lấy brand đang active
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", brand_controller_1.brandController.list);
exports.BRAND_ROUTES = router;
