import express, { Router } from "express";
import { brandController } from "../modules/client/controllers/brand.controller";

const router: Router = express.Router();

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
router.get("/", brandController.list);

export const BRAND_ROUTES = router;
