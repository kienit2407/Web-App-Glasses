// src/service/address.service.ts
import { Types } from "mongoose"
import { User, IUser, IAddress } from "../../../models/user.model"
import { geoService } from "./geo.service"

interface CreateAddressPayload {
    recipient_name: string
    phone: string
    province_code: string
    district_code: string
    ward_code: string
    specific_address: string
    is_default?: boolean
}

interface UpdateAddressPayload {
    recipient_name?: string
    phone?: string
    province_code?: string
    district_code?: string
    ward_code?: string
    specific_address?: string
    is_default?: boolean
}

export const addressService = {
    async listMyAddresses(userId: Types.ObjectId) {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error("User not found");

        const rawAddresses = user.delivering_addresses || [];

        // Xử lý map dữ liệu: Biến đổi Code -> Text
        const enrichedAddresses = await Promise.all(rawAddresses.map(async (addr: any) => {
            // Gọi Geo Service để lấy tên Phường, Quận, Tỉnh
            const geoDetails = await geoService.getAddressDetails(
                addr.province_code,
                addr.district_code,
                addr.ward_code
            );

            return {
                ...addr, 
                province_name: geoDetails.province_name,
                district_name: geoDetails.district_name,
                ward_name: geoDetails.ward_name,
                full_address: geoDetails.full_location 
            };
        }));

        return {
            addresses: enrichedAddresses,
            default_address_id: rawAddresses.find((a: any) => a.is_default)?.["_id"] ?? null,
        };
    },

    async createMyAddress(
        userId: Types.ObjectId,
        payload: CreateAddressPayload
    ) {
        const user = await User.findById(userId)
        if (!user) throw new Error("User not found")

        const isFirst = user.delivering_addresses.length === 0
        const willBeDefault = isFirst || payload.is_default

        // Nếu địa chỉ này là default → clear default cũ
        if (willBeDefault) {
            user.delivering_addresses.forEach((addr) => {
                addr.is_default = false
            })
        }

        const newAddress: IAddress = {
            recipient_name: payload.recipient_name,
            phone: payload.phone,
            province_code: payload.province_code,
            district_code: payload.district_code,
            ward_code: payload.ward_code,
            specific_address: payload.specific_address,
            is_default: !!willBeDefault,
        }

        user.delivering_addresses.push(newAddress)
        await user.save()

        const last = user.delivering_addresses[user.delivering_addresses.length - 1]

        return {
            addresses: user.delivering_addresses,
            created: last,
        }
    },

    async updateMyAddress(
        userId: Types.ObjectId,
        addressId: string,
        payload: UpdateAddressPayload
    ) {
        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id")
        }

        const user = await User.findById(userId)
        if (!user) throw new Error("User not found")

        const addr = user.delivering_addresses.id(addressId as any) as any
        if (!addr) {
            throw new Error("Address not found")
        }

        // Cập nhật field
        if (payload.recipient_name !== undefined)
            addr.recipient_name = payload.recipient_name
        if (payload.phone !== undefined) addr.phone = payload.phone
        if (payload.province_code !== undefined)
            addr.province_code = payload.province_code
        if (payload.district_code !== undefined)
            addr.district_code = payload.district_code
        if (payload.ward_code !== undefined) addr.ward_code = payload.ward_code
        if (payload.specific_address !== undefined)
            addr.specific_address = payload.specific_address

        // Xử lý default nếu có gửi lên
        if (payload.is_default === true) {
            user.delivering_addresses.forEach((a: any) => {
                a.is_default = a._id.equals(addr._id)
            })
        }

        await user.save()

        return {
            addresses: user.delivering_addresses,
            updated: addr,
        }
    },

    async deleteMyAddress(userId: Types.ObjectId, addressId: string) {
        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id")
        }

        const user = await User.findById(userId)
        if (!user) throw new Error("User not found")

        const addr = user.delivering_addresses.id(addressId as any) as any
        if (!addr) {
            throw new Error("Address not found")
        }

        const wasDefault = addr.is_default

        addr.deleteOne() // xoá subdocument khỏi mảng

        // Nếu xoá default và vẫn còn địa chỉ khác → set cái đầu tiên làm default
        if (wasDefault && user.delivering_addresses.length > 0) {
            user.delivering_addresses.forEach((a: any, idx: number) => {
                a.is_default = idx === 0
            })
        }

        await user.save()

        return {
            addresses: user.delivering_addresses,
        }
    },

    async setDefaultMyAddress(userId: Types.ObjectId, addressId: string) {
        if (!Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id")
        }

        const user = await User.findById(userId)
        if (!user) throw new Error("User not found")

        const addr = user.delivering_addresses.id(addressId as any) as any
        if (!addr) {
            throw new Error("Address not found")
        }

        user.delivering_addresses.forEach((a: any) => {
            a.is_default = a._id.equals(addr._id)
        })

        await user.save()

        return {
            addresses: user.delivering_addresses,
            default_address_id: addr._id,
        }
    },

    // dùng cho order snapshot
    async getMyAddressById(userId: Types.ObjectId, addressId: string) {
        if (!Types.ObjectId.isValid(addressId)) {
            return null
        }

        const user = await User.findById(userId).lean()
        if (!user) return null

        const addr = (user.delivering_addresses || []).find(
            (a: any) => String(a._id) === addressId
        )

        if (!addr) return null

        const snapshot: IAddress = {
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            province_code: addr.province_code,
            district_code: addr.district_code,
            ward_code: addr.ward_code,
            specific_address: addr.specific_address,
            is_default: addr.is_default,
        }

        return snapshot
    },
}
