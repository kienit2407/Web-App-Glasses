import { Request, Response } from "express"
import { Types } from "mongoose"
import { TryCatch } from "../../../utils/try_catch"
import {
    BadRequestException,
} from "../../../utils/app_errol"
import { orderService, PaymentMethod } from "../services/order.service"

// POST /orders
export const create = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const {
        cart_item_ids,
        items,
        address_id,
        note,
        coupon_code,
        payment_method
    } = req.body as {
        cart_item_ids?: string[]
        items?: { variant_id: string; quantity: number }[]
        address_id?: string
        note?: string
        coupon_code?: string
        payment_method?: PaymentMethod
    }

    if (!address_id) {
        throw new BadRequestException("address_id is required")
    }

    const userId = new Types.ObjectId(req.user._id)

    // ƯU TIÊN: nếu có cart_item_ids -> luồng giỏ hàng
    if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
        const result = await orderService.createOrder(userId, {
            cart_item_ids,
            address_id,
            note,
            coupon_code,
            payment_method
        })

        return res.status(201).json({ data: result })
    }

    // Nếu không có cart_item_ids, nhưng có items -> luồng Mua ngay
    if (items && Array.isArray(items) && items.length > 0) {
        const result = await orderService.createOrderFromDirect(userId, {
            items,
            address_id,
            note,
            coupon_code,
            payment_method
        })

        return res.status(201).json({ data: result })
    }

    throw new BadRequestException("Either cart_item_ids or items is required")
})

// GET /orders?status=&page=&limit=
export const listMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { status, page = "1", limit = "10" } = req.query as {
        status?: string
        page?: string
        limit?: string
    }

    const result = await orderService.listMyOrders(userId, {
        status,
        page: Number(page),
        limit: Number(limit),
    })

    return res.json({ data: result })
})

// GET /orders/:id
export const detailMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { id } = req.params

    const result = await orderService.getMyOrderDetail(userId, id)

    return res.json({ data: result })
})

// PATCH /orders/:id/cancel  (user yêu cầu huỷ)
export const cancelMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { id } = req.params

    const data = await orderService.requestCancelMyOrder(userId, id)

    return res.json({ data })
})

// POST /orders/:id/reorder  (mua lại)
export const reorderMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { id } = req.params

    const data = await orderService.reorderMyOrder(userId, id)

    return res.json({ data })
})

// PATCH /orders/:id/confirm-delivered
export const confirmDeliveredMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { id } = req.params

    const data = await orderService.confirmDeliveredMyOrder(userId, id)

    return res.json({ data })
})

// PATCH /orders/:id/request-return
export const requestReturnMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new BadRequestException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)
    const { id } = req.params

    const data = await orderService.requestReturnMyOrder(userId, id)

    return res.json({ data })
})

export const orderController = {
    create,
    listMy,
    detailMy,
    cancelMy,
    reorderMy,
    confirmDeliveredMy,
    requestReturnMy,
}
