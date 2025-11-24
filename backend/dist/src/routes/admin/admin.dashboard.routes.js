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
router.get("/summary", authMiddleware_1.authMidleWares.protectUserRoute, // nếu có; không thì bỏ
admin_dashboard_controller_1.getDashboardSummary);
exports.ADMIN_DASHBOARD_ROUTES = router;
