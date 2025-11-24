"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardService = void 0;
// src/modules/admin/services/admin.dashboard.service.ts
const orders_model_1 = require("../../../models/orders.model");
exports.adminDashboardService = {
    async getSummary() {
        // --- 1. Tổng quan ---
        const [agg] = await orders_model_1.Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 }, // tất cả đơn
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$order_status", "delivered"] },
                                "$total_amount",
                                0
                            ]
                        }
                    },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ["$order_status", "pending"] }, 1, 0] },
                    },
                    cancelledCount: {
                        $sum: { $cond: [{ $eq: ["$order_status", "cancelled"] }, 1, 0] },
                    },
                    deliveredCount: {
                        $sum: { $cond: [{ $eq: ["$order_status", "delivered"] }, 1, 0] },
                    },
                },
            },
        ]);
        const summary = {
            totalOrders: agg?.totalOrders || 0,
            totalRevenue: agg?.totalRevenue || 0,
            pendingCount: agg?.pendingCount || 0,
            cancelledCount: agg?.cancelledCount || 0,
            deliveredCount: agg?.deliveredCount || 0,
        };
        // --- 2. Chart: doanh thu theo tuần hiện tại (Thứ 2 -> CN) ---
        const today = new Date();
        // JS getDay(): 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
        const day = today.getDay();
        // Tính số ngày cần lùi để về Thứ 2
        // Nếu hôm nay là CN (0) -> lùi 6 ngày
        // Nếu hôm nay là T3 (2) -> lùi 1 ngày, v.v.
        const diffToMonday = day === 0 ? -6 : 1 - day;
        // startDate = thứ 2 tuần hiện tại, lúc 00:00:00
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() + diffToMonday);
        // endDate = Chủ nhật tuần hiện tại, lúc 23:59:59.999
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        const revenueAgg = await orders_model_1.Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    order_status: "delivered",
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    revenue: { $sum: "$total_amount" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const map = new Map();
        revenueAgg.forEach((r) => map.set(r._id, { revenue: r.revenue, orders: r.orders }));
        // build đủ 7 ngày từ Thứ 2 -> CN
        const chart = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
            const found = map.get(key) || { revenue: 0, orders: 0 };
            chart.push({
                date: key.slice(5), // "MM-DD" cho dễ nhìn
                revenue: found.revenue,
                orders: found.orders,
            });
        }
        return { summary, chart };
    },
};
