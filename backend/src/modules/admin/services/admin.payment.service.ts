// src/service/admin_payment.service.ts
import { Types } from "mongoose";
import {
    Payment,
    IPayment,
    TPaymentProvider,
    TPaymentState,
} from "../../../models/payments.model";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";

interface SearchPaymentsParams {
    page?: number;
    limit?: number;
    provider?: TPaymentProvider;
    status?: TPaymentState;
    user_id?: string;
    order_id?: string;
    code?: string;       // transaction_code search
    from_date?: string;  // ISO date string
    to_date?: string;
}

export const adminPaymentService = {
    /**
     * List / search payments cho admin
     */
    async search(params: SearchPaymentsParams) {
        const {
            page = 1,
            limit = 20,
            provider,
            status,
            user_id,
            order_id,
            code,
            from_date,
            to_date,
        } = params;

        const filter: any = {};

        if (provider) {
            filter.provider = provider;
        }

        if (status) {
            filter.status = status;
        }

        if (user_id) {
            if (!Types.ObjectId.isValid(user_id)) {
                throw new BadRequestException("Invalid user_id");
            }
            filter.user_id = new Types.ObjectId(user_id);
        }

        if (order_id) {
            if (!Types.ObjectId.isValid(order_id)) {
                throw new BadRequestException("Invalid order_id");
            }
            filter.order_id = new Types.ObjectId(order_id);
        }

        if (code) {
            filter.transaction_code = new RegExp(code.trim(), "i");
        }

        if (from_date || to_date) {
            filter.createdAt = {};
            if (from_date) {
                const d = new Date(from_date);
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid from_date");
                filter.createdAt.$gte = d;
            }
            if (to_date) {
                const d = new Date(to_date);
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid to_date");
                filter.createdAt.$lte = d;
            }
        }

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("user_id", "display_name email")
                .populate("order_id", "order_number")
                .lean(),
            Payment.countDocuments(filter),
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

    /**
     * Chi tiết 1 payment
     */
    async detail(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const payment = await Payment.findById(id)
            .populate("user_id", "display_name email")
            .populate("order_id", "order_number total_amount order_status payment_status")
            .lean();

        if (!payment) {
            throw new NotFoundException("Payment not found");
        }

        return payment;
    },

    /**
     * Cập nhật trạng thái payment:
     * - pending -> success | failed
     * - success -> refunded
     * - failed  -> pending (nếu muốn re-try)
     * - refunded -> (final)
     */
    async updateStatus(id: string, nextStatus: TPaymentState) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const payment = await Payment.findById(id);
        if (!payment) {
            throw new NotFoundException("Payment not found");
        }

        const current = payment.status;

        const allowedTransitions: Record<TPaymentState, TPaymentState[]> = {
            pending: ["success", "failed"],
            success: ["refunded"],
            failed: ["pending"],
            refunded: [],
        };

        const allowedNext = allowedTransitions[current] || [];
        if (!allowedNext.includes(nextStatus)) {
            throw new BadRequestException(
                `Invalid status transition: ${current} -> ${nextStatus}`
            );
        }

        payment.status = nextStatus;

        if (nextStatus === "success" && !payment.paidAt) {
            payment.paidAt = new Date();
        }

        // TODO:
        // nếu nextStatus = "refunded" thì ở đây bạn có thể
        // - gọi API refund VNPay/Momo...
        // - đồng bộ lại payment_status bên Order nếu cần

        await payment.save();

        return payment.toObject();
    },
};
