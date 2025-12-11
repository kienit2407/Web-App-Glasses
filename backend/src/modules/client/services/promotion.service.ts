// src/modules/client/services/promotion.service.ts
import { Types } from "mongoose";
import { BadRequestException } from "../../../utils/app_errol";
import { Promotion } from "../../../models/promotion.model";
import { UserPromotionView } from "../../../models/user.promotion.view.model";

export const promotionService = {
    // 1) List cho CouponCenter – chỉ cần khuyến mãi đang/ sắp chạy
    async listForCenter() {
        const now = new Date();

        const promotions = await Promotion.find({
            is_active: true,
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gte: now } }],
        })
            .sort({ priority: -1, start_date: -1 })
            .lean();

        return promotions.map((p) => ({
            _id: p._id,
            title: p.title,
            description: p.description,
            banner_url: p.banner_url,
            discount_type: p.discount_type,
            discount_value: p.discount_value,
            max_discount: p.max_discount ?? null,
            min_order: p.min_order ?? null,
            start_date: p.start_date,
            end_date: p.end_date ?? null,
        }));
    },

    // 2) Lấy một promotion highlight để show trong popup
    async getHighlight(userId: Types.ObjectId) {
        const now = new Date();

        // 1) Lấy tất cả promotion đang chạy
        const promotions = await Promotion.find({
            is_active: true,
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gte: now } }],
        })
            .sort({ start_date: -1, createdAt: -1 })
            .lean();

        if (!promotions.length) {
            return { promotion: null, already_seen: true };
        }

        const promoIds = promotions.map((p) => p._id);

        // 2) Lấy danh sách promotion mà user đã xem trong đống này
        const views = await UserPromotionView.find({
            user_id: userId,
            promotion_id: { $in: promoIds },
        })
            .select("promotion_id")
            .lean();

        const seenSet = new Set(views.map((v) => String(v.promotion_id)));

        // 3) Tìm promotion ĐẦU TIÊN mà user CHƯA xem
        const firstUnseen = promotions.find(
            (p) => !seenSet.has(String(p._id))
        );

        if (!firstUnseen) {
            // User đã xem hết các promotion đang chạy
            return { promotion: null, already_seen: true };
        }

        // 4) Trả về đúng 1 promotion chưa xem
        return {
            promotion: {
                _id: firstUnseen._id,
                title: firstUnseen.title,
                description: firstUnseen.description,
                banner_url: firstUnseen.banner_url,
                start_date: firstUnseen.start_date,
                end_date: firstUnseen.end_date ?? null,
            },
            already_seen: false, // đã đảm bảo đây là promo chưa xem
        };
    },

    // 3) Đánh dấu user đã xem popup promotion này
    async markHighlightSeen(userId: Types.ObjectId, promotionId: string) {
        if (!Types.ObjectId.isValid(promotionId)) {
            throw new BadRequestException("Invalid promotion id");
        }

        const promoObjectId = new Types.ObjectId(promotionId);

        await UserPromotionView.updateOne(
            {
                user_id: userId,
                promotion_id: promoObjectId,
            },
            {
                $setOnInsert: {
                    seen_at: new Date(),
                },
            },
            { upsert: true }
        );

        return { success: true };
    },
};
