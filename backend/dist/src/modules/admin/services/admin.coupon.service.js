"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCouponService = void 0;
// src/modules/client/services/admin.coupon.service.ts
const mongoose_1 = require("mongoose");
const coupons_model_1 = require("../../../models/coupons.model");
const user_coupons_1 = require("../../../models/user.coupons");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
exports.adminCouponService = {
    async list(params) {
        const { page = 1, limit = 20, code, type, is_active, from_date, to_date, } = params;
        const filter = {};
        if (code) {
            filter.code = new RegExp(code.trim(), "i");
        }
        if (type) {
            filter.type = type;
        }
        if (typeof is_active === "boolean") {
            filter.is_active = is_active;
        }
        if (from_date || to_date) {
            filter.createdAt = {};
            if (from_date) {
                const d = new Date(from_date);
                if (isNaN(d.getTime()))
                    throw new app_errol_1.BadRequestException("Invalid from_date");
                filter.createdAt.$gte = d;
            }
            if (to_date) {
                const d = new Date(to_date);
                if (isNaN(d.getTime()))
                    throw new app_errol_1.BadRequestException("Invalid to_date");
                filter.createdAt.$lte = d;
            }
        }
        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            coupons_model_1.Coupon.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            coupons_model_1.Coupon.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limitNum) || 1;
        // ===== Thống kê số lượt dùng / số user / số user đã lưu voucher =====
        const couponIds = items.map((it) => it._id);
        let usageStats = [];
        if (couponIds.length > 0) {
            usageStats = await user_coupons_1.UserCoupon.aggregate([
                { $match: { coupon_id: { $in: couponIds } } },
                {
                    $group: {
                        _id: "$coupon_id",
                        used_count: {
                            $sum: {
                                $cond: [{ $eq: ["$is_used", true] }, 1, 0],
                            },
                        },
                        saved_count: { $sum: 1 },
                        user_ids: { $addToSet: "$user_id" },
                    },
                },
                {
                    $project: {
                        used_count: 1,
                        saved_count: 1,
                        user_count: { $size: "$user_ids" },
                    },
                },
            ]);
        }
        const usageMap = new Map();
        for (const u of usageStats) {
            usageMap.set(String(u._id), {
                used_count: u.used_count ?? 0,
                saved_count: u.saved_count ?? 0,
                user_count: u.user_count ?? 0,
            });
        }
        const itemsWithStats = items.map((it) => {
            const stat = usageMap.get(String(it._id)) || {
                used_count: 0,
                saved_count: 0,
                user_count: 0,
            };
            return {
                ...it,
                used_count: stat.used_count,
                saved_count: stat.saved_count,
                user_count: stat.user_count,
            };
        });
        return {
            items: itemsWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
    },
    // ========== CREATE ==========
    async create(payload) {
        let { code, type, value, max_discount, min_order, usage_limit, per_user_limit, start_date, end_date, is_active, } = payload;
        if (!code || !type || value == null || !start_date) {
            throw new app_errol_1.BadRequestException("code, type, value, start_date are required");
        }
        code = code.trim().toUpperCase();
        if (value < 0) {
            throw new app_errol_1.BadRequestException("value must be >= 0");
        }
        if (type === "percent" && value > 100) {
            throw new app_errol_1.BadRequestException("percent coupon value cannot be > 100");
        }
        const start = new Date(start_date);
        if (isNaN(start.getTime())) {
            throw new app_errol_1.BadRequestException("Invalid start_date");
        }
        let end = null;
        if (end_date) {
            end = new Date(end_date);
            if (isNaN(end.getTime())) {
                throw new app_errol_1.BadRequestException("Invalid end_date");
            }
            if (end < start) {
                throw new app_errol_1.BadRequestException("end_date must be >= start_date");
            }
        }
        try {
            const coupon = await coupons_model_1.Coupon.create({
                code,
                type,
                value,
                max_discount: max_discount ?? null,
                min_order: min_order ?? null,
                usage_limit: usage_limit ?? null,
                per_user_limit: per_user_limit ?? null,
                start_date: start,
                end_date: end,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });
            return coupon.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Coupon code already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot create coupon", 500);
        }
    },
    // ========== UPDATE ==========
    async update(id, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const coupon = await coupons_model_1.Coupon.findById(id);
        if (!coupon) {
            throw new app_errol_1.NotFoundException("Coupon not found");
        }
        let { code, type, value, max_discount, min_order, usage_limit, per_user_limit, start_date, end_date, is_active, } = payload;
        if (code !== undefined) {
            coupon.code = code.trim().toUpperCase();
        }
        if (type !== undefined) {
            coupon.type = type;
        }
        if (value !== undefined) {
            if (value < 0)
                throw new app_errol_1.BadRequestException("value must be >= 0");
            if (coupon.type === "percent" && value > 100) {
                throw new app_errol_1.BadRequestException("percent coupon value cannot be > 100");
            }
            coupon.value = value;
        }
        if (max_discount !== undefined) {
            coupon.max_discount = max_discount ?? null;
        }
        if (min_order !== undefined) {
            coupon.min_order = min_order ?? null;
        }
        if (usage_limit !== undefined) {
            coupon.usage_limit = usage_limit ?? null;
        }
        if (per_user_limit !== undefined) {
            coupon.per_user_limit = per_user_limit ?? null;
        }
        if (start_date !== undefined) {
            const d = new Date(start_date);
            if (isNaN(d.getTime()))
                throw new app_errol_1.BadRequestException("Invalid start_date");
            coupon.start_date = d;
        }
        if (end_date !== undefined) {
            if (end_date === null || end_date === "") {
                coupon.end_date = null;
            }
            else {
                const d = new Date(end_date);
                if (isNaN(d.getTime()))
                    throw new app_errol_1.BadRequestException("Invalid end_date");
                if (d < coupon.start_date) {
                    throw new app_errol_1.BadRequestException("end_date must be >= start_date");
                }
                coupon.end_date = d;
            }
        }
        if (typeof is_active === "boolean") {
            coupon.is_active = is_active;
        }
        try {
            await coupon.save();
            return coupon.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Coupon code already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot update coupon", 500);
        }
    },
    // ========== REMOVE (SOFT DELETE) ==========
    async remove(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const coupon = await coupons_model_1.Coupon.findById(id);
        if (!coupon) {
            throw new app_errol_1.NotFoundException("Coupon not found");
        }
        coupon.is_active = false;
        await coupon.save();
        return { success: true };
    },
    // ========== HARD DELETE ==========
    async hardRemove(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const coupon = await coupons_model_1.Coupon.findById(id);
        if (!coupon) {
            throw new app_errol_1.NotFoundException("Coupon not found");
        }
        // Xoá coupon
        await coupons_model_1.Coupon.deleteOne({ _id: coupon._id });
        // Xoá luôn user_coupons liên quan (nếu muốn giữ log thì bỏ dòng này)
        await user_coupons_1.UserCoupon.deleteMany({ coupon_id: coupon._id });
        return { success: true };
    },
};
