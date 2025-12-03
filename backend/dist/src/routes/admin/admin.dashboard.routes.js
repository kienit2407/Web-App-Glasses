"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_DASHBOARD_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_dashboard_controller_1 = require("../../modules/admin/controllers/admin.dashboard.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = express_1.default.Router();
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
router.get("/summary", authMiddleware_1.authMidleWares.protectUserRoute, admin_dashboard_controller_1.getDashboardSummary);
exports.ADMIN_DASHBOARD_ROUTES = router;
