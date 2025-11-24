"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const admin_dashboard_service_1 = require("../services/admin.dashboard.service");
const getDashboardSummary = async (req, res, next) => {
    try {
        const data = await admin_dashboard_service_1.adminDashboardService.getSummary();
        return res.status(200).json({
            status: "success",
            data,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDashboardSummary = getDashboardSummary;
