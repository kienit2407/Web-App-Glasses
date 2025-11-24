"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressController = exports.setDefaultMy = exports.deleteMy = exports.updateMy = exports.createMy = exports.listMy = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const address_service_1 = require("../services/address.service");
// GET /addresses
exports.listMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const result = await address_service_1.addressService.listMyAddresses(userId);
    return res.json({ data: result });
});
// POST /addresses
exports.createMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { recipient_name, phone, province_code, district_code, ward_code, specific_address, is_default, } = req.body;
    if (!recipient_name || !phone || !province_code || !district_code || !ward_code || !specific_address) {
        throw new app_errol_1.BadRequestException("Missing required address fields");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const result = await address_service_1.addressService.createMyAddress(userId, {
        recipient_name,
        phone,
        province_code,
        district_code,
        ward_code,
        specific_address,
        is_default,
    });
    return res.status(201).json({ data: result });
});
// PATCH /addresses/:addressId
exports.updateMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { addressId } = req.params;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        const result = await address_service_1.addressService.updateMyAddress(userId, addressId, req.body);
        return res.json({ data: result });
    }
    catch (err) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        if (err.message === "Invalid address id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot update address");
    }
});
// DELETE /addresses/:addressId
exports.deleteMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { addressId } = req.params;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        const result = await address_service_1.addressService.deleteMyAddress(userId, addressId);
        return res.json({ data: result });
    }
    catch (err) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        if (err.message === "Invalid address id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot delete address");
    }
});
// PATCH /addresses/:addressId/default
exports.setDefaultMy = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const { addressId } = req.params;
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    try {
        const result = await address_service_1.addressService.setDefaultMyAddress(userId, addressId);
        return res.json({ data: result });
    }
    catch (err) {
        if (err.message === "Address not found" || err.message === "User not found") {
            throw new app_errol_1.NotFoundException(err.message);
        }
        if (err.message === "Invalid address id") {
            throw new app_errol_1.BadRequestException(err.message);
        }
        throw new app_errol_1.BadRequestException(err.message || "Cannot set default address");
    }
});
exports.addressController = {
    listMy: exports.listMy,
    createMy: exports.createMy,
    updateMy: exports.updateMy,
    deleteMy: exports.deleteMy,
    setDefaultMy: exports.setDefaultMy,
};
