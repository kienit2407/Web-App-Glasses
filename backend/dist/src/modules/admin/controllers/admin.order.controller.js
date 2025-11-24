"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderController = exports.updateStatus = exports.detail = exports.search = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_order_service_1 = require("../services/admin.order.service");
// GET /admin/orders?status=&payment_status=&user_id=&order_number=&from_date=&to_date=&page=&limit=
exports.search = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { order_status, payment_status, user_id, order_number, from_date, to_date, page, limit, } = req.query;
    const data = await admin_order_service_1.adminOrderService.search({
        order_status: order_status,
        payment_status: payment_status,
        user_id,
        order_number,
        from_date,
        to_date,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    return res.json({ data });
});
// GET /admin/orders/:id
exports.detail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new app_errol_1.BadRequestException("id is required");
    }
    const data = await admin_order_service_1.adminOrderService.detail(id);
    console.log(data);
    return res.json({ data });
});
// PATCH /admin/orders/:id/status
// body: { order_status: "processing" | "shipping" | ... }
exports.updateStatus = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const { order_status } = req.body;
    if (!id) {
        throw new app_errol_1.BadRequestException("id is required");
    }
    if (!order_status) {
        throw new app_errol_1.BadRequestException("order_status is required");
    }
    const data = await admin_order_service_1.adminOrderService.updateStatus(id, order_status);
    return res.json({ data });
});
exports.adminOrderController = {
    search: exports.search,
    detail: exports.detail,
    updateStatus: exports.updateStatus,
};
