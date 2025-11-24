"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.changePassword = exports.updateMe = exports.listMyCoupons = exports.getMe = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const user_service_1 = require("../services/user.service");
const app_errol_1 = require("../../../utils/app_errol");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
const coupon_service_1 = require("../services/coupon.service");
exports.getMe = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    // req.user do middleware inject, đã loại hashed_password rồi
    // Nếu bạn muốn luôn lấy bản mới nhất từ DB thì có thể gọi userService.getById
    return res.json({ data: req.user });
});
exports.listMyCoupons = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const subtotalRaw = req.query.subtotal;
    const subtotal = typeof subtotalRaw === "string" ? Number(subtotalRaw) : undefined;
    const items = await coupon_service_1.couponService.listMyCoupons(userId, subtotal);
    return res.json({ data: { items } });
});
exports.updateMe = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { display_name } = req.body;
    let avatar_url;
    let avatar_id;
    // Nếu FE upload file mới → upload Cloudinary
    if (req.file) {
        const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "users/avatars");
        avatar_url = secure_url;
        avatar_id = public_id;
    }
    const user = await user_service_1.userService.updateMe(userId, {
        display_name,
        avatar_url,
        avatar_id,
    });
    return res.json({ data: user });
});
exports.changePassword = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
        throw new app_errol_1.BadRequestException("current_password, new_password and confirm_password are required");
    }
    if (new_password !== confirm_password) {
        throw new app_errol_1.BadRequestException("Confirm password does not match");
    }
    await user_service_1.userService.changePassword(userId, {
        current_password,
        new_password,
    });
    return res.json({
        message: "Password changed successfully",
    });
});
exports.userController = {
    getMe: exports.getMe,
    updateMe: exports.updateMe,
    changePassword: exports.changePassword,
    listMyCoupons: exports.listMyCoupons
};
