// src/controllers/address.controller.ts
import { Request, Response } from "express"
import { Types } from "mongoose"
import { TryCatch } from "../../../utils/try_catch"
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from "../../../utils/app_errol"
import { addressService } from "../services/address.service"

// GET /addresses
export const listMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized")
    }

    const userId = new Types.ObjectId(req.user._id)

    const result = await addressService.listMyAddresses(userId)
    console.log(result)
    return res.json({ data: result })
})

// POST /addresses
export const createMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized")
    }

    const {
        recipient_name,
        phone,
        province_code,
        district_code,
        ward_code,
        specific_address,
        is_default,
    } = req.body

    if (!recipient_name || !phone || !province_code || !district_code || !ward_code || !specific_address) {
        throw new BadRequestException("Missing required address fields")
    }

    const userId = new Types.ObjectId(req.user._id)

    const result = await addressService.createMyAddress(userId, {
        recipient_name,
        phone,
        province_code,
        district_code,
        ward_code,
        specific_address,
        is_default,
    })

    return res.status(201).json({ data: result })
})

// PATCH /addresses/:addressId
export const updateMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized")
    }

    const { addressId } = req.params
    const userId = new Types.ObjectId(req.user._id)

    try {
        const result = await addressService.updateMyAddress(
            userId,
            addressId,
            req.body
        )

        return res.json({ data: result })
    } catch (err: any) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new NotFoundException(err.message)
        }
        if (err.message === "Invalid address id") {
            throw new BadRequestException(err.message)
        }
        throw new BadRequestException(err.message || "Cannot update address")
    }
})

// DELETE /addresses/:addressId
export const deleteMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized")
    }

    const { addressId } = req.params
    const userId = new Types.ObjectId(req.user._id)

    try {
        const result = await addressService.deleteMyAddress(userId, addressId)

        return res.json({ data: result })
    } catch (err: any) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new NotFoundException(err.message)
        }
        if (err.message === "Invalid address id") {
            throw new BadRequestException(err.message)
        }
        throw new BadRequestException(err.message || "Cannot delete address")
    }
})

// PATCH /addresses/:addressId/default
export const setDefaultMy = TryCatch(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        throw new UnauthorizedException("Unauthorized")
    }

    const { addressId } = req.params
    const userId = new Types.ObjectId(req.user._id)

    try {
        const result = await addressService.setDefaultMyAddress(userId, addressId)

        return res.json({ data: result })
    } catch (err: any) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new NotFoundException(err.message)
        }
        if (err.message === "Invalid address id") {
            throw new BadRequestException(err.message)
        }
        throw new BadRequestException(err.message || "Cannot set default address")
    }
})

export const addressController = {
    listMy,
    createMy,
    updateMy,
    deleteMy,
    setDefaultMy,
}
