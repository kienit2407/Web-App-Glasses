import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminPaymentService } from "../services/admin.payment.service";

// GET /admin/payments
export const search = TryCatch(async (req: Request, res: Response) => {
    const {
        provider,
        status,
        user_id,
        order_id,
        code,
        from_date,
        to_date,
        page,
        limit,
    } = req.query as {
        provider?: any;
        status?: any;
        user_id?: string;
        order_id?: string;
        code?: string;
        from_date?: string;
        to_date?: string;
        page?: string;
        limit?: string;
    };

    const data = await adminPaymentService.search({
        provider: provider as any,
        status: status as any,
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
export const detail = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const payment = await adminPaymentService.detail(id);
    return res.json({ data: payment });
});

// PATCH /admin/payments/:id/status
export const updateStatus = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status?: any };

    if (!id) throw new BadRequestException("id is required");
    if (!status) throw new BadRequestException("status is required");

    const payment = await adminPaymentService.updateStatus(id, status);
    return res.json({ data: payment });
});

export const adminPaymentController = {
    search,
    detail,
    updateStatus,
};
