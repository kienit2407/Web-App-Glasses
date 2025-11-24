
import express from "express";
import { getDashboardSummary } from "../../modules/admin/controllers/admin.dashboard.controller"
import { authMidleWares } from "../../middleware/authMiddleware";

const router = express.Router();

router.get(
  "/summary",
  authMidleWares.protectUserRoute, // nếu có; không thì bỏ
  getDashboardSummary
);

export const ADMIN_DASHBOARD_ROUTES = router
