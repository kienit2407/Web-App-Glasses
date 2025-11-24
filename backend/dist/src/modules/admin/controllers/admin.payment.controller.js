"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentController = exports.updateStatus = exports.detail = exports.search = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_payment_service_1 = require("../services/admin.payment.service");
// GET /admin/payments
exports.search = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { provider, status, user_id, order_id, code, from_date, to_date, page, limit, } = req.query;
    const data = await admin_payment_service_1.adminPaymentService.search({
        provider: provider,
        status: status,
        user_id,
        order_id,
        code,
        from_date,
        to_date,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    return res.json({ data });
});
// GET /admin/payments/:id
exports.detail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const payment = await admin_payment_service_1.adminPaymentService.detail(id);
    return res.json({ data: payment });
});
// PATCH /admin/payments/:id/status
exports.updateStatus = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    if (!status)
        throw new app_errol_1.BadRequestException("status is required");
    const payment = await admin_payment_service_1.adminPaymentService.updateStatus(id, status);
    return res.json({ data: payment });
});
exports.adminPaymentController = {
    search: exports.search,
    detail: exports.detail,
    updateStatus: exports.updateStatus,
};
