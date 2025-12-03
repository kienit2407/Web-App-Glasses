import express from "express";
import { getDashboardSummary } from "../../modules/admin/controllers/admin.dashboard.controller"
import { authMidleWares } from "../../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Dashboard
 *     description: Tổng quan số liệu bán hàng
 */

/**
 * @swagger
 * /admin/dashboard/summary:
 *   get:
 *     summary: Lấy summary dashboard (doanh thu, đơn hàng, users...)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get(
  "/summary",
  authMidleWares.protectUserRoute,
  getDashboardSummary
);

export const ADMIN_DASHBOARD_ROUTES = router
