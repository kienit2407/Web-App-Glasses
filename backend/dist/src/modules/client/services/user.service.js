"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../../../models/user.model");
const app_errol_1 = require("../../../utils/app_errol");
const cloudinary_1 = require("../../../config/cloudinary");
const user_coupons_1 = require("../../../models/user.coupons");
exports.userService = {
    async getById(userId) {
        const user = await user_model_1.User.findById(userId).select("-hashed_password");
        if (!user) {
            throw new app_errol_1.NotFoundException("User not found");
        }
        return user;
    },
    async listMyCoupons(userId, subtotal) {
        const userCoupons = await user_coupons_1.UserCoupon.find({
            user_id: userId,
            is_saved: true,
        })
            .populate("coupon_id")
            .lean();
        const now = new Date();
        const items = userCoupons
            .map((uc) => {
            const c = uc.coupon_id;
            if (!c || !c.is_active)
                return null;
            const isExpired = (c.start_date && now < c.start_date) ||
                (c.end_date && now > c.end_date);
            const minOrder = c.min_order ?? 0;
            const missingAmount = subtotal < minOrder ? minOrder - subtotal : 0;
            // đếm số lần đã dùng
            // (nếu bạn đang check usage_limit ở chỗ khác rồi thì có thể bỏ)
            // const usedCount = ...
            const canUse = !isExpired &&
                subtotal >= minOrder; // + thêm các điều kiện usage_limit / per_user_limit nếu muốn
            return {
                _id: uc._id,
                code: c.code,
                type: c.type,
                value: c.value,
                max_discount: c.max_discount,
                min_order: c.min_order,
                start_date: c.start_date,
                end_date: c.end_date,
                can_use: canUse,
                is_expired: isExpired,
                missing_amount: missingAmount,
            };
        })
            .filter(Boolean);
        return { items };
    },
    async updateMe(userId, payload) {
        const user = await user_model_1.User.findById(userId);
        if (!user)
            throw new app_errol_1.NotFoundException("User not found");
        // nếu có avatar mới và user đang có avatar cũ -> xoá Cloudinary cũ
        if (payload.avatar_id && payload.avatar_id !== user.avatar_id && user.avatar_id) {
            try {
                await cloudinary_1.cloudinaryClient.uploader.destroy(user.avatar_id);
            }
            catch (err) {
                console.error("Cannot delete old avatar:", err);
            }
        }
        if (payload.display_name !== undefined) {
            user.display_name = payload.display_name;
        }
        if (payload.avatar_url !== undefined) {
            user.avatar_url = payload.avatar_url;
        }
        if (payload.avatar_id !== undefined) {
            user.avatar_id = payload.avatar_id;
        }
        await user.save();
        return await user_model_1.User.findById(userId).select("-hashed_password");
    },
    async changePassword(userId, payload) {
        const { current_password, new_password } = payload;
        if (!current_password || !new_password) {
            throw new app_errol_1.BadRequestException("Missing password fields");
        }
        if (new_password.length < 8) {
            throw new app_errol_1.BadRequestException("New password must be at least 8 characters");
        }
        // Lấy user kèm hashed_password (vì schema đang select: false)
        const user = await user_model_1.User.findById(userId).select("+hashed_password");
        if (!user) {
            throw new app_errol_1.NotFoundException("User not found");
        }
        if (!user.password) {
            // tài khoản đăng nhập bằng Google, chưa có password local
            throw new app_errol_1.BadRequestException("This account does not have a password. Please use social login or set password via forgot password flow.");
        }
        const isMatch = await bcryptjs_1.default.compare(current_password, user.password);
        if (!isMatch) {
            throw new app_errol_1.BadRequestException("Current password is incorrect");
        }
        // Nếu muốn, có thể check new_password != current_password
        if (current_password === new_password) {
            throw new app_errol_1.BadRequestException("New password must be different from current password");
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashed = await bcryptjs_1.default.hash(new_password, salt);
        user.password = hashed;
        await user.save();
        // (Optional) TODO:
        // - revoke all refresh tokens / sessions của user để bắt login lại
        //   nếu bạn đang lưu session trong Redis chẳng hạn.
        return true;
    },
};
