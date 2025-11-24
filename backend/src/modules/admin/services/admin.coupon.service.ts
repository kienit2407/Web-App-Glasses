// src/modules/client/services/admin.coupon.service.ts
import { Types } from "mongoose";
import { Coupon, ICoupon, TCouponType } from "../../../models/coupons.model";
import { UserCoupon } from "../../../models/user.coupons";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";

interface ListCouponsParams {
    page?: number;
    limit?: number;
    code?: string;
    type?: TCouponType;
    is_active?: boolean;
    from_date?: string;
    to_date?: string;
}

interface CreateCouponPayload {
    code: string;
    type: TCouponType;
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    start_date: string | Date;
    end_date?: string | Date | null;
    is_active?: boolean;
}

interface UpdateCouponPayload {
    code?: string;
    type?: TCouponType;
    value?: number;
    max_discount?: number | null;
    min_order?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    start_date?: string | Date;
    end_date?: string | Date | null;
    is_active?: boolean;
}

export const adminCouponService = {
    // ========== LIST ==========
    async list(params: ListCouponsParams) {
        const {
            page = 1,
            limit = 20,
            code,
            type,
            is_active,
            from_date,
            to_date,
        } = params;

        const filter: any = {};

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
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid from_date");
                filter.createdAt.$gte = d;
            }
            if (to_date) {
                const d = new Date(to_date);
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid to_date");
                filter.createdAt.$lte = d;
            }
        }

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Coupon.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Coupon.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limitNum) || 1;

        // ===== Thống kê số lượt dùng / số user / số user đã lưu voucher =====
        const couponIds = items.map((it) => it._id);
        let usageStats: {
            _id: Types.ObjectId;
            used_count: number;
            saved_count: number;
            user_count: number;
        }[] = [];

        if (couponIds.length > 0) {
            usageStats = await UserCoupon.aggregate([
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

        const usageMap = new Map<
            string,
            { used_count: number; saved_count: number; user_count: number }
        >();
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
    async create(payload: CreateCouponPayload) {
        let {
            code,
            type,
            value,
            max_discount,
            min_order,
            usage_limit,
            per_user_limit,
            start_date,
            end_date,
            is_active,
        } = payload;

        if (!code || !type || value == null || !start_date) {
            throw new BadRequestException("code, type, value, start_date are required");
        }

        code = code.trim().toUpperCase();

        if (value < 0) {
            throw new BadRequestException("value must be >= 0");
        }

        if (type === "percent" && value > 100) {
            throw new BadRequestException("percent coupon value cannot be > 100");
        }

        const start = new Date(start_date);
        if (isNaN(start.getTime())) {
            throw new BadRequestException("Invalid start_date");
        }

        let end: Date | null = null;
        if (end_date) {
            end = new Date(end_date);
            if (isNaN(end.getTime())) {
                throw new BadRequestException("Invalid end_date");
            }
            if (end < start) {
                throw new BadRequestException("end_date must be >= start_date");
            }
        }

        try {
            const coupon = await Coupon.create({
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
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Coupon code already exists");
            }
            throw new AppError(err.message || "Cannot create coupon", 500);
        }
    },

    // ========== UPDATE ==========
    async update(id: string, payload: UpdateCouponPayload) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            throw new NotFoundException("Coupon not found");
        }

        let {
            code,
            type,
            value,
            max_discount,
            min_order,
            usage_limit,
            per_user_limit,
            start_date,
            end_date,
            is_active,
        } = payload;

        if (code !== undefined) {
            coupon.code = code.trim().toUpperCase();
        }

        if (type !== undefined) {
            coupon.type = type;
        }

        if (value !== undefined) {
            if (value < 0) throw new BadRequestException("value must be >= 0");
            if (coupon.type === "percent" && value > 100) {
                throw new BadRequestException("percent coupon value cannot be > 100");
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
            if (isNaN(d.getTime())) throw new BadRequestException("Invalid start_date");
            coupon.start_date = d;
        }

        if (end_date !== undefined) {
            if (end_date === null || end_date === "") {
                coupon.end_date = null;
            } else {
                const d = new Date(end_date);
                if (isNaN(d.getTime())) throw new BadRequestException("Invalid end_date");
                if (d < coupon.start_date) {
                    throw new BadRequestException("end_date must be >= start_date");
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
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Coupon code already exists");
            }
            throw new AppError(err.message || "Cannot update coupon", 500);
        }
    },

    // ========== REMOVE (SOFT DELETE) ==========
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            throw new NotFoundException("Coupon not found");
        }

        coupon.is_active = false;
        await coupon.save();

        return { success: true };
    },

    // ========== HARD DELETE ==========
    async hardRemove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            throw new NotFoundException("Coupon not found");
        }

        // Xoá coupon
        await Coupon.deleteOne({ _id: coupon._id });
        // Xoá luôn user_coupons liên quan (nếu muốn giữ log thì bỏ dòng này)
        await UserCoupon.deleteMany({ coupon_id: coupon._id });

        return { success: true };
    },
};
