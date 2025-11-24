// src/modules/admin/services/admin.order.service.ts
import { Types } from "mongoose";
import { Order, TOrderStatus, TPaymentStatus } from "../../../models/orders.model";
import { OrderItem } from "../../../models/orders.item.model";
import {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";
import { Payment } from "../../../models/payments.model";
import { SEND_EVENT_TO_USER } from "../../../config/socket.io";
import { Notification } from "../../../models/notification.model";

interface SearchOrdersParams {
    page?: number;
    limit?: number;
    order_status?: TOrderStatus | "cancel_requested" | "return_requested"
    payment_status?: TPaymentStatus;
    order_number?: string;
    user_id?: string;
    from_date?: string;
    to_date?: string;
}

export const adminOrderService = {
    async search(params: SearchOrdersParams) {
        const {
            page = 1,
            limit = 20,
            order_status,
            payment_status,
            order_number,
            user_id,
            from_date,
            to_date,
        } = params;

        const filter: any = {};

        if (order_status) {
            if (order_status === "cancel_requested") {
                filter.cancel_requested = true;
            }
            else if (order_status === "return_requested") {
                filter.return_requested = true;
            } else {
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
            if (!Types.ObjectId.isValid(user_id)) {
                throw new BadRequestException("Invalid user_id");
            }
            filter.user_id = new Types.ObjectId(user_id);
        }

        if (from_date || to_date) {
            filter.createdAt = {};
            if (from_date) {
                const from = new Date(from_date);
                if (isNaN(from.getTime())) {
                    throw new BadRequestException("Invalid from_date");
                }
                filter.createdAt.$gte = from;
            }
            if (to_date) {
                const to = new Date(to_date);
                if (isNaN(to.getTime())) {
                    throw new BadRequestException("Invalid to_date");
                }
                filter.createdAt.$lte = to;
            }
        }

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name email")
                .lean(),
            Order.countDocuments(filter),
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

    async detail(orderId: string) {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestException("Invalid id");
        }

        const order = await Order.findById(orderId)
            .populate("user_id", "display_name email")
            .lean();

        if (!order) {
            throw new NotFoundException("Order not found");
        }

        const items = await OrderItem.find({ order_id: order._id })
            .populate("product_id", "product_name slug thumbnail_url")
            .populate("variant_id", "sku_variant")
            .lean();
        const payment = await Payment.findOne({ order_id: order._id })
            .sort({ createdAt: -1 })
            .lean();

        const orderWithPayment = {
            ...order,
            payment_method: payment?.provider ?? null, // "cod" | "vnpay" | null
            payment_detail: payment || null,           // nếu bạn muốn xem thêm trong FE
        };
        return {
            order: orderWithPayment,
            items,
        };
    },

    async updateStatus(orderId: string, nextStatus: TOrderStatus) {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestException("Invalid id");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundException("Order not found");
        }

        const current = order.order_status as TOrderStatus;

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

        const allowedTransitions: Record<TOrderStatus, TOrderStatus[]> = {
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
            throw new BadRequestException(
                `Invalid status transition: ${current} -> ${nextStatus}`
            );
        }

        // Nếu duyệt huỷ → cần đã có request huỷ (tuỳ policy bạn)
        if (nextStatus === "cancelled" && !order.cancel_requested) {
            throw new BadRequestException("Order has not requested cancellation");
        }

        // Nếu duyệt trả → cần đã request trả
        if (nextStatus === "returned" && !order.return_requested) {
            throw new BadRequestException("Order has not requested return");
        }

        order.order_status = nextStatus;

        if (nextStatus === "cancelled") {
            order.cancel_requested = false;
        }
        if (nextStatus === "returned") {
            order.return_requested = false;
        }

        await order.save();
        // Notification cho user về việc cập nhật trạng thái đơn
        const newStatusLabel = (() => {
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
        })();

        let thumbnailUrl: string | null = null;
        const firstItem = await OrderItem.findOne({ order_id: order._id })
            .populate("product_id", "thumbnail_url")
            .lean();

        if (firstItem && firstItem.product_id) {
            const p: any = firstItem.product_id;
            thumbnailUrl = p.thumbnail_url || p.thumbnail || null;
        }

        await Notification.create({
            audience: "user",
            user_id: order.user_id,
            category: "order",
            type: "user:order_status_updated",
            title: `Cập nhật trạng thái đơn #${order.order_number}`,
            message: `Đơn hàng của bạn đã được cập nhật trạng thái: ${newStatusLabel}.`,
            thumbnail_url: thumbnailUrl,
            meta: {
                order_id: order._id,
                order_number: order.order_number,
                order_status: order.order_status,
                order_status_label: newStatusLabel,
            },
        });

        SEND_EVENT_TO_USER(String(order.user_id), "order:status_updated", {
            order_id: order._id,
            order_number: order.order_number,
            new_status: order.order_status,
            new_status_label: newStatusLabel,
        });

        return order.toObject();
    },
};
