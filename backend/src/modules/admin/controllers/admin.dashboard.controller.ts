// src/modules/admin/controllers/admin.dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { adminDashboardService } from "../services/admin.dashboard.service";

export const getDashboardSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await adminDashboardService.getSummary();
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        next(err);
    }
};
