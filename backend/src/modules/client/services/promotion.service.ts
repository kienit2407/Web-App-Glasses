// src/modules/client/services/promotion.service.ts
import { Types } from "mongoose";
import { BadRequestException } from "../../../utils/app_errol";
import { Promotion } from "../../../models/promotion.model";
import { UserPromotionView } from "../../../models/user.promotion.view.model";

export const promotionService = {
    // 1) List cho CouponCenter – chỉ cần khuyến mãi đang/ sắp chạy
    async listForCenter(userId: Types.ObjectId) {
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

        // Nếu bạn có field riêng ví dụ show_in_popup thì add vào filter
        const promo = await Promotion.findOne({
            is_active: true,
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gte: now } }],
        })
            .sort({ priority: -1, start_date: -1 }) // ưu tiên priority cao
            .lean();

        if (!promo) {
            return { promotion: null, already_seen: true };
        }

        const view = await UserPromotionView.findOne({
            user_id: userId,
            promotion_id: promo._id,
        }).lean();

        return {
            promotion: {
                _id: promo._id,
                title: promo.title,
                description: promo.description,
                banner_url: promo.banner_url,
                start_date: promo.start_date,
                end_date: promo.end_date ?? null,
            },
            already_seen: !!view,
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
