"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.codConfirm = exports.vnpIpn = exports.vnpReturn = exports.vnpCreate = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const payment_service_1 = require("../services/payment.service");
const getClientIp_1 = require("../../../utils/getClientIp");
const environment_1 = require("../../../config/environment");
// POST /payments/vnpay/create
exports.vnpCreate = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { order_id, returnUrl } = req.body;
    if (!order_id) {
        throw new app_errol_1.BadRequestException("order_id is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const clientIp = (0, getClientIp_1.getClientIp)(req);
    try {
        const result = await payment_service_1.paymentService.createVnpPaymentUrl({
            userId,
            orderId: order_id,
            returnUrl,
            clientIp,
        });
        return res.json({
            data: {
                payment_url: result.paymentUrl,
                payment_id: result.paymentId,
                txn_ref: result.txnRef,
            },
        });
    }
    catch (err) {
        throw new app_errol_1.BadRequestException(err.message || "Cannot create VNPAY payment");
    }
});
// GET /payments/vnpay/return
exports.vnpReturn = (0, try_catch_1.TryCatch)(async (req, res) => {
    const FRONTEND_URL = environment_1.env.FRONTEND_URL || "http://localhost:5173";
    try {
        const result = await payment_service_1.paymentService.handleVnpReturn(req.query);
        const redirectUrl = `${FRONTEND_URL}/payment-result` +
            `?vnp_status=${result.status}` +
            `&order_id=${result.orderId}` +
            `&code=${result.responseCode}`;
        console.log("VNPAY RETURN OK, redirect to:", redirectUrl);
        return res.redirect(redirectUrl);
    }
    catch (err) {
        const redirectUrl = `${FRONTEND_URL}/payment-result` +
            `?vnp_status=error` +
            `&msg=${encodeURIComponent(err.message || "Invalid VNPAY return")}`;
        console.log("VNPAY RETURN ERROR, redirect to:", redirectUrl);
        return res.redirect(redirectUrl);
    }
});
// POST /payments/vnpay/ipn
exports.vnpIpn = (0, try_catch_1.TryCatch)(async (req, res) => {
    const result = await payment_service_1.paymentService.handleVnpIpn(req.query || req.body);
    // VNPAY thường expect JSON: {RspCode, Message}
    return res.json(result);
});
// POST /payments/cod/confirm
exports.codConfirm = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { order_id } = req.body;
    if (!order_id) {
        throw new app_errol_1.BadRequestException("order_id is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        const payment = await payment_service_1.paymentService.codConfirm(userId, order_id);
        return res.status(201).json({ data: payment });
    }
    catch (err) {
        throw new app_errol_1.BadRequestException(err.message || "Cannot confirm COD");
    }
});
exports.paymentController = {
    vnpCreate: exports.vnpCreate,
    vnpReturn: exports.vnpReturn,
    vnpIpn: exports.vnpIpn,
    codConfirm: exports.codConfirm,
};
