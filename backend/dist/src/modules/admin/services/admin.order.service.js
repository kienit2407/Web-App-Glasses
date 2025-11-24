"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderService = void 0;
// src/modules/admin/services/admin.order.service.ts
const mongoose_1 = require("mongoose");
const orders_model_1 = require("../../../models/orders.model");
const orders_item_model_1 = require("../../../models/orders.item.model");
const app_errol_1 = require("../../../utils/app_errol");
const payments_model_1 = require("../../../models/payments.model");
const socket_io_1 = require("../../../config/socket.io");
exports.adminOrderService = {
    async search(params) {
        const { page = 1, limit = 20, order_status, payment_status, order_number, user_id, from_date, to_date, } = params;
        const filter = {};
        if (order_status) {
            if (order_status === "cancel_requested") {
                filter.cancel_requested = true;
            }
            else {
                filter.order_status = order_status;
            }
        }
        if (payment_status) {
            filter.payment_status = payment_status;
        }
        if (order_number) {
            filter.order_number = new RegExp(order_number.trim(), "i");
        }
        if (user_id) {
            if (!mongoose_1.Types.ObjectId.isValid(user_id)) {
                throw new app_errol_1.BadRequestException("Invalid user_id");
            }
            filter.user_id = new mongoose_1.Types.ObjectId(user_id);
        }
        if (from_date || to_date) {
            filter.createdAt = {};
            if (from_date) {
                const from = new Date(from_date);
                if (isNaN(from.getTime())) {
                    throw new app_errol_1.BadRequestException("Invalid from_date");
                }
                filter.createdAt.$gte = from;
            }
            if (to_date) {
                const to = new Date(to_date);
                if (isNaN(to.getTime())) {
                    throw new app_errol_1.BadRequestException("Invalid to_date");
                }
                filter.createdAt.$lte = to;
            }
        }
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            orders_model_1.Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name email")
                .lean(),
            orders_model_1.Order.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limitNum) || 1;
        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
    },
    async detail(orderId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const order = await orders_model_1.Order.findById(orderId)
            .populate("user_id", "display_name email")
            .lean();
        if (!order) {
            throw new app_errol_1.NotFoundException("Order not found");
        }
        const items = await orders_item_model_1.OrderItem.find({ order_id: order._id })
            .populate("product_id", "product_name slug thumbnail_url")
            .populate("variant_id", "sku_variant")
            .lean();
        const payment = await payments_model_1.Payment.findOne({ order_id: order._id })
            .sort({ createdAt: -1 })
            .lean();
        const orderWithPayment = {
            ...order,
            payment_method: payment?.provider ?? null, // "cod" | "vnpay" | null
            payment_detail: payment || null, // nếu bạn muốn xem thêm trong FE
        };
        return {
            order: orderWithPayment,
            items,
        };
    },
    async updateStatus(orderId, nextStatus) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const order = await orders_model_1.Order.findById(orderId);
        if (!order) {
            throw new app_errol_1.NotFoundException("Order not found");
        }
        const current = order.order_status;
        // Trường hợp đặc biệt: từ chối huỷ / từ chối trả
        // FE có thể gửi nextStatus === current để "clear flag"
        if (nextStatus === current) {
            if (order.cancel_requested) {
                order.cancel_requested = false;
            }
            if (order.return_requested) {
                order.return_requested = false;
            }
            await order.save();
            return order.toObject();
        }
        const allowedTransitions = {
            pending: ["processing", "cancelled"],
            processing: ["shipping", "cancelled"],
            shipping: ["delivering", "cancelled"],
            delivering: ["delivered"],
            delivered: ["returned"],
            cancelled: [],
            returned: [],
        };
        const allowedNext = allowedTransitions[current] || [];
        if (!allowedNext.includes(nextStatus)) {
            throw new app_errol_1.BadRequestException(`Invalid status transition: ${current} -> ${nextStatus}`);
        }
        // Nếu duyệt huỷ → cần đã có request huỷ (tuỳ policy bạn)
        if (nextStatus === "cancelled" && !order.cancel_requested) {
            throw new app_errol_1.BadRequestException("Order has not requested cancellation");
        }
        // Nếu duyệt trả → cần đã request trả
        if (nextStatus === "returned" && !order.return_requested) {
            throw new app_errol_1.BadRequestException("Order has not requested return");
        }
        order.order_status = nextStatus;
        if (nextStatus === "cancelled") {
            order.cancel_requested = false;
        }
        if (nextStatus === "returned") {
            order.return_requested = false;
        }
        await order.save();
        (0, socket_io_1.SEND_EVENT_TO_USER)(String(order.user_id), "order:status_updated", {
            order_id: order._id,
            order_number: order.order_number,
            new_status: order.order_status,
            new_status_label: (() => {
                switch (order.order_status) {
                    case "pending": return "Chờ xác nhận";
                    case "processing": return "Đang xử lý";
                    case "shipping": return "Đang vận chuyển";
                    case "delivering": return "Chờ giao";
                    case "delivered": return "Hoàn thành";
                    case "cancelled": return "Đã huỷ";
                    case "returned": return "Đã trả hàng";
                    default: return order.order_status;
                }
            })(),
        });
        return order.toObject();
    },
};
