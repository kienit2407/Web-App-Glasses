"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressService = void 0;
// src/service/address.service.ts
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../../models/user.model");
exports.addressService = {
    async listMyAddresses(userId) {
        const user = await user_model_1.User.findById(userId).lean();
        if (!user)
            throw new Error("User not found");
        const addresses = user.delivering_addresses || [];
        return {
            addresses,
            default_address_id: addresses.find((a) => a.is_default)?.["_id"] ?? null,
        };
    },
    async createMyAddress(userId, payload) {
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new Error("User not found");
        const isFirst = user.delivering_addresses.length === 0;
        const willBeDefault = isFirst || payload.is_default;
        // Nếu địa chỉ này là default → clear default cũ
        if (willBeDefault) {
            user.delivering_addresses.forEach((addr) => {
                addr.is_default = false;
            });
        }
        const newAddress = {
            recipient_name: payload.recipient_name,
            phone: payload.phone,
            province_code: payload.province_code,
            district_code: payload.district_code,
            ward_code: payload.ward_code,
            specific_address: payload.specific_address,
            is_default: !!willBeDefault,
        };
        user.delivering_addresses.push(newAddress);
        await user.save();
        const last = user.delivering_addresses[user.delivering_addresses.length - 1];
        return {
            addresses: user.delivering_addresses,
            created: last,
        };
    },
    async updateMyAddress(userId, addressId, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id");
        }
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new Error("User not found");
        const addr = user.delivering_addresses.id(addressId);
        if (!addr) {
            throw new Error("Address not found");
        }
        // Cập nhật field
        if (payload.recipient_name !== undefined)
            addr.recipient_name = payload.recipient_name;
        if (payload.phone !== undefined)
            addr.phone = payload.phone;
        if (payload.province_code !== undefined)
            addr.province_code = payload.province_code;
        if (payload.district_code !== undefined)
            addr.district_code = payload.district_code;
        if (payload.ward_code !== undefined)
            addr.ward_code = payload.ward_code;
        if (payload.specific_address !== undefined)
            addr.specific_address = payload.specific_address;
        // Xử lý default nếu có gửi lên
        if (payload.is_default === true) {
            user.delivering_addresses.forEach((a) => {
                a.is_default = a._id.equals(addr._id);
            });
        }
        await user.save();
        return {
            addresses: user.delivering_addresses,
            updated: addr,
        };
    },
    async deleteMyAddress(userId, addressId) {
        if (!mongoose_1.Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id");
        }
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new Error("User not found");
        const addr = user.delivering_addresses.id(addressId);
        if (!addr) {
            throw new Error("Address not found");
        }
        const wasDefault = addr.is_default;
        addr.deleteOne(); // xoá subdocument khỏi mảng
        // Nếu xoá default và vẫn còn địa chỉ khác → set cái đầu tiên làm default
        if (wasDefault && user.delivering_addresses.length > 0) {
            user.delivering_addresses.forEach((a, idx) => {
                a.is_default = idx === 0;
            });
        }
        await user.save();
        return {
            addresses: user.delivering_addresses,
        };
    },
    async setDefaultMyAddress(userId, addressId) {
        if (!mongoose_1.Types.ObjectId.isValid(addressId)) {
            throw new Error("Invalid address id");
        }
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new Error("User not found");
        const addr = user.delivering_addresses.id(addressId);
        if (!addr) {
            throw new Error("Address not found");
        }
        user.delivering_addresses.forEach((a) => {
            a.is_default = a._id.equals(addr._id);
        });
        await user.save();
        return {
            addresses: user.delivering_addresses,
            default_address_id: addr._id,
        };
    },
    // dùng cho order snapshot
    async getMyAddressById(userId, addressId) {
        if (!mongoose_1.Types.ObjectId.isValid(addressId)) {
            return null;
        }
        const user = await user_model_1.User.findById(userId).lean();
        if (!user)
            return null;
        const addr = (user.delivering_addresses || []).find((a) => String(a._id) === addressId);
        if (!addr)
            return null;
        const snapshot = {
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            province_code: addr.province_code,
            district_code: addr.district_code,
            ward_code: addr.ward_code,
            specific_address: addr.specific_address,
            is_default: addr.is_default,
        };
        return snapshot;
    },
};
