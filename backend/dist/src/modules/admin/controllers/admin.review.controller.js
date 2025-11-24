"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReviewController = exports.remove = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_review_service_1 = require("../services/admin.review.service");
// GET /admin/reviews?product_id=&user_id=&rating=&page=&limit=
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { product_id, // lọc theo product
    user_id, // lọc theo user
    product_name, user_name, rating, page, limit, } = req.query;
    const data = await admin_review_service_1.adminReviewService.list({
        product_id,
        user_id,
        product_name,
        user_name,
        rating: rating ? Number(rating) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    return res.json({ data });
});
// DELETE /admin/reviews/:id
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new app_errol_1.BadRequestException("id is required");
    }
    const result = await admin_review_service_1.adminReviewService.remove(id);
    return res.json({ data: result });
});
exports.adminReviewController = {
    list: exports.list,
    remove: exports.remove,
};
