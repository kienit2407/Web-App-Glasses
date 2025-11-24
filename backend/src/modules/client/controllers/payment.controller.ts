// src/controllers/payment.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TryCatch } from "../../../utils/try_catch";
import {
    BadRequestException,
    UnauthorizedException,
} from "../../../utils/app_errol";
import { paymentService } from "../services/payment.service";
import { getClientIp } from "../../../utils/getClientIp";
import { env } from "../../../config/environment";

// POST /payments/vnpay/create
export const vnpCreate = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { order_id, returnUrl } = req.body;

    if (!order_id) {
        throw new BadRequestException("order_id is required");
    }

    const userId = new Types.ObjectId(req.user._id);
    const clientIp = getClientIp(req);

    try {
        const result = await paymentService.createVnpPaymentUrl({
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
    } catch (err: any) {
        throw new BadRequestException(err.message || "Cannot create VNPAY payment");
    }
});

// GET /payments/vnpay/return
export const vnpReturn = TryCatch(async (req: Request, res: Response) => {
    const FRONTEND_URL = env.FRONTEND_URL || "http://localhost:5173";

    try {
        const result = await paymentService.handleVnpReturn(req.query);

        const redirectUrl =
            `${FRONTEND_URL}/payment-result` +
            `?vnp_status=${result.status}` +
            `&order_id=${result.orderId}` +
            `&code=${result.responseCode}` +
            `&method=vnpay`;

        console.log("VNPAY RETURN OK, redirect to:", redirectUrl);
        return res.redirect(redirectUrl);
    } catch (err: any) {
        const redirectUrl =
            `${FRONTEND_URL}/payment-result` +
            `?vnp_status=error` +
            `&msg=${encodeURIComponent(err.message || "Invalid VNPAY return")}`;

        console.log("VNPAY RETURN ERROR, redirect to:", redirectUrl);
        return res.redirect(redirectUrl);
    }
});

// POST /payments/vnpay/ipn
export const vnpIpn = TryCatch(async (req: Request, res: Response) => {
    const result = await paymentService.handleVnpIpn(req.query || req.body);

    // VNPAY thường expect JSON: {RspCode, Message}
    return res.json(result);
});

// POST /payments/cod/confirm
export const codConfirm = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized");
    }

    const { order_id } = req.body;

    if (!order_id) {
        throw new BadRequestException("order_id is required");
    }

    const userId = new Types.ObjectId(req.user._id);

    try {
        const payment = await paymentService.codConfirm(userId, order_id);
        return res.status(201).json({ data: payment });
    } catch (err: any) {
        throw new BadRequestException(err.message || "Cannot confirm COD");
    }
});

export const paymentController = {
    vnpCreate,
    vnpReturn,
    vnpIpn,
    codConfirm,
};
