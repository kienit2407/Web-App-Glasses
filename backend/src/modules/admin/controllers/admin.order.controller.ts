// src/controllers/admin_order.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminOrderService } from "../services/admin.order.service";

// GET /admin/orders?status=&payment_status=&user_id=&order_number=&from_date=&to_date=&page=&limit=
export const search = TryCatch(async (req: Request, res: Response) => {
    const {
        order_status,
        payment_status,
        user_id,
        order_number,
        from_date,
        to_date,
        page,
        limit,
    } = req.query as {
        order_status?: any;
        payment_status?: any;
        user_id?: string;
        order_number?: string;
        from_date?: string;
        to_date?: string;
        page?: string;
        limit?: string;
    };

    const data = await adminOrderService.search({
        order_status: order_status as any,
        payment_status: payment_status as any,
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
export const detail = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestException("id is required");
    }

    const data = await adminOrderService.detail(id);
    console.log(data)
    return res.json({ data });
});

// PATCH /admin/orders/:id/status
// body: { order_status: "processing" | "shipping" | ... }
export const updateStatus = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { order_status } = req.body as { order_status?: any };

    if (!id) {
        throw new BadRequestException("id is required");
    }
    if (!order_status) {
        throw new BadRequestException("order_status is required");
    }

    const data = await adminOrderService.updateStatus(id, order_status);

    return res.json({ data });
});

export const adminOrderController = {
    search,
    detail,
    updateStatus,
};
