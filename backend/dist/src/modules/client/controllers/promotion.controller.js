"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = exports.markHighlightSeen = exports.getHighlight = exports.listCenter = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const promotion_service_1 = require("../services/promotion.service");
exports.listCenter = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const items = await promotion_service_1.promotionService.listForCenter(userId);
    return res.json({ data: { items } });
});
exports.getHighlight = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await promotion_service_1.promotionService.getHighlight(userId);
    return res.json({ data });
});
exports.markHighlightSeen = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.UnauthorizedException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("promotion id is required");
    const data = await promotion_service_1.promotionService.markHighlightSeen(userId, id);
    return res.json({ data });
});
exports.promotionController = {
    listCenter: exports.listCenter,
    getHighlight: exports.getHighlight,
    markHighlightSeen: exports.markHighlightSeen,
};
