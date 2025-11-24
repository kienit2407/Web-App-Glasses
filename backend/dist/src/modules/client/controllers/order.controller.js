"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.requestReturnMy = exports.confirmDeliveredMy = exports.reorderMy = exports.cancelMy = exports.detailMy = exports.listMy = exports.create = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const order_service_1 = require("../services/order.service");
// POST /orders
exports.create = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const { cart_item_ids, address_id, note, coupon_code } = req.body;
    if (!cart_item_ids || !Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
        throw new app_errol_1.BadRequestException("cart_item_ids is required");
    }
    if (!address_id) {
        throw new app_errol_1.BadRequestException("address_id is required");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const result = await order_service_1.orderService.createOrder(userId, {
        cart_item_ids,
        address_id,
        note,
        coupon_code,
    });
    return res.status(201).json({ data: result });
});
// GET /orders?status=&page=&limit=
exports.listMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { status, page = "1", limit = "10" } = req.query;
    const result = await order_service_1.orderService.listMyOrders(userId, {
        status,
        page: Number(page),
        limit: Number(limit),
    });
    return res.json({ data: result });
});
// GET /orders/:id
exports.detailMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const result = await order_service_1.orderService.getMyOrderDetail(userId, id);
    return res.json({ data: result });
});
// PATCH /orders/:id/cancel  (user yêu cầu huỷ)
exports.cancelMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await order_service_1.orderService.requestCancelMyOrder(userId, id);
    return res.json({ data });
});
// POST /orders/:id/reorder  (mua lại)
exports.reorderMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await order_service_1.orderService.reorderMyOrder(userId, id);
    return res.json({ data });
});
// PATCH /orders/:id/confirm-delivered
exports.confirmDeliveredMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await order_service_1.orderService.confirmDeliveredMyOrder(userId, id);
    return res.json({ data });
});
// PATCH /orders/:id/request-return
exports.requestReturnMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await order_service_1.orderService.requestReturnMyOrder(userId, id);
    return res.json({ data });
});
exports.orderController = {
    create: exports.create,
    listMy: exports.listMy,
    detailMy: exports.detailMy,
    cancelMy: exports.cancelMy,
    reorderMy: exports.reorderMy,
    confirmDeliveredMy: exports.confirmDeliveredMy,
    requestReturnMy: exports.requestReturnMy,
};
