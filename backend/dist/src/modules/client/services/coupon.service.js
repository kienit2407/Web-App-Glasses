"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = void 0;
const coupons_model_1 = require("../../../models/coupons.model");
const user_coupons_1 = require("../../../models/user.coupons");
const app_errol_1 = require("../../../utils/app_errol");
exports.couponService = {
    // helper: tính discount
    computeDiscount(subtotal, coupon) {
        if (subtotal <= 0)
            return 0;
        let discount = 0;
        if (coupon.type === "percent") {
            const raw = (subtotal * coupon.value) / 100;
            if (coupon.max_discount)
                discount = Math.min(raw, coupon.max_discount);
            else
                discount = raw;
        }
        else if (coupon.type === "fixed") {
            discount = Math.min(coupon.value, subtotal);
        }
        if (!Number.isFinite(discount) || discount < 0)
            discount = 0;
        return Math.floor(discount);
    },
    // (cũ, nếu bạn không dùng ở đâu có thể bỏ, mình giữ nguyên)
    async claimCoupon(userId, code) {
        if (!code)
            throw new Error("Coupon code is required");
        const normalizedCode = code.trim().toUpperCase();
        const now = new Date();
        const coupon = await coupons_model_1.Coupon.findOne({
            code: normalizedCode,
            is_active: true,
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gte: now } }],
        });
        if (!coupon) {
            throw new Error("Coupon không tồn tại hoặc hết hạn");
        }
        try {
            const userCoupon = await user_coupons_1.UserCoupon.create({
                user_id: userId,
                coupon_id: coupon._id,
            });
            return {
                coupon: {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                },
                user_coupon: userCoupon,
            };
        }
        catch (err) {
            if (err.code === 11000) {
                throw new Error("You already claimed this coupon");
            }
            throw err;
        }
    },
    async checkCoupon(userId, rawCode, subtotal) {
        const code = rawCode.trim().toUpperCase();
        const coupon = await coupons_model_1.Coupon.findOne({
            code,
            is_active: true,
        }).lean();
        if (!coupon) {
            throw new app_errol_1.BadRequestException("Coupon không tồn tại hoặc đã ngừng hoạt động");
        }
        const now = new Date();
        if (coupon.start_date && now < coupon.start_date) {
            throw new app_errol_1.BadRequestException("Coupon chưa bắt đầu");
        }
        if (coupon.end_date && now > coupon.end_date) {
            throw new app_errol_1.BadRequestException("Coupon đã hết hạn");
        }
        if (typeof subtotal === "number" &&
            coupon.min_order != null &&
            subtotal < coupon.min_order) {
            throw new app_errol_1.BadRequestException(`Đơn hàng phải lớn hơn ${coupon.min_order} VND để sử dụng voucher này`);
        }
        // limit theo user
        if (userId && coupon.per_user_limit != null && coupon.per_user_limit > 0) {
            const usedByUser = await user_coupons_1.UserCoupon.countDocuments({
                user_id: userId,
                coupon_id: coupon._id,
                is_used: true,
            });
            if (usedByUser >= coupon.per_user_limit) {
                throw new app_errol_1.BadRequestException("Bạn đã dùng hết số lần cho phép của coupon này");
            }
        }
        // limit toàn hệ thống
        if (coupon.usage_limit != null && coupon.usage_limit > 0) {
            const usedTotal = await user_coupons_1.UserCoupon.countDocuments({
                coupon_id: coupon._id,
                is_used: true,
            });
            if (usedTotal >= coupon.usage_limit) {
                throw new app_errol_1.BadRequestException("Coupon đã hết lượt sử dụng");
            }
        }
        return {
            _id: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount,
            min_order: coupon.min_order,
            start_date: coupon.start_date,
            end_date: coupon.end_date,
        };
    },
    // user "lưu" coupon về ví (CTA Lưu ở Coupon Center)
    async claim(userId, rawCode) {
        // reuse logic check để đảm bảo coupon hợp lệ
        const info = await this.checkCoupon(userId, rawCode);
        const now = new Date();
        await user_coupons_1.UserCoupon.updateOne({ user_id: userId, coupon_id: info._id }, {
            // Nếu đã tồn tại record thì chỉ cần đánh dấu là đã lưu
            $set: {
                is_saved: true,
            },
            // Nếu chưa có thì insert mới
            $setOnInsert: {
                user_id: userId,
                coupon_id: info._id,
                is_used: false,
                saved_at: now,
            },
        }, { upsert: true });
        return info;
    },
    // ===== LIST cho Coupon Center: list tất cả coupon đang hoạt động + flag is_saved =====
    async listAvailableForUser(userId) {
        const now = new Date();
        const coupons = await coupons_model_1.Coupon.find({
            is_active: true,
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gte: now } }],
        }).lean();
        if (coupons.length === 0)
            return [];
        const couponIds = coupons.map((c) => c._id);
        const userCoupons = await user_coupons_1.UserCoupon.find({
            user_id: userId,
            coupon_id: { $in: couponIds },
        })
            .lean();
        const map = new Map();
        userCoupons.forEach((uc) => {
            map.set(String(uc.coupon_id), uc);
        });
        return coupons.map((c) => {
            const uc = map.get(String(c._id));
            return {
                _id: c._id,
                code: c.code,
                type: c.type,
                value: c.value,
                max_discount: c.max_discount,
                min_order: c.min_order,
                start_date: c.start_date,
                end_date: c.end_date,
                is_active: c.is_active,
                is_saved: !!uc?.is_saved,
                is_used: !!uc?.is_used,
            };
        });
    },
    // ===== LIST ví voucher của user (cho /users/me/coupons, có thể truyền subtotal) =====
    async listMyCoupons(userId, subtotal) {
        const rows = await user_coupons_1.UserCoupon.find({ user_id: userId })
            .populate("coupon_id")
            .lean();
        const now = new Date();
        const items = rows
            .map((row) => {
            const c = row.coupon_id;
            if (!c)
                return null;
            // 1. Bỏ các voucher đã dùng
            if (row.is_used)
                return null;
            // 2. Check per-user limit (nếu bạn đang track used_count trên Coupon)
            if (c.per_user_limit != null && c.per_user_limit > 0) {
                if (c.used_count >= c.per_user_limit) {
                    return null;
                }
            }
            // 3. Check expire / active -> nếu hết hạn hoặc inactive thì loại luôn
            const timeInvalid = (c.start_date && now < c.start_date) ||
                (c.end_date && now > c.end_date);
            const inactive = !c.is_active;
            const is_expired = timeInvalid || inactive;
            if (is_expired) {
                return null;
            }
            // 4. Tính khả năng sử dụng theo subtotal
            let can_use = true; // tới đây là còn hạn & chưa dùng
            let missing_amount;
            if (typeof subtotal === "number" && c.min_order != null) {
                if (subtotal < c.min_order) {
                    can_use = false;
                    missing_amount = c.min_order - subtotal;
                }
            }
            return {
                _id: String(row._id),
                code: c.code,
                type: c.type,
                value: c.value,
                max_discount: c.max_discount,
                min_order: c.min_order,
                start_date: c.start_date,
                end_date: c.end_date,
                can_use,
                is_expired: false, // luôn false vì đã lọc hết expired ở trên
                missing_amount,
                is_used: row.is_used, // luôn false nhưng giữ cho đủ thông tin
            };
        })
            .filter(Boolean);
        return items;
    },
};
