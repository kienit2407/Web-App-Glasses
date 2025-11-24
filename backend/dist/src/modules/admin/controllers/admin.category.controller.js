"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCategoryController = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_categories_service_1 = require("../services/admin.categories.service");
const list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { q, page, limit, status } = req.query;
    const data = await admin_categories_service_1.adminCategoryService.list({
        q: q,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status === "active" || status === "inactive" ? status : undefined,
    });
    return res.json({ data });
});
const create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { category_name, slug, description, parent_id, is_active } = req.body;
    const cat = await admin_categories_service_1.adminCategoryService.create({
        category_name,
        slug,
        description,
        parent_id,
        is_active,
    });
    return res.status(201).json({ data: cat });
});
const update = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const { category_name, slug, description, parent_id, is_active } = req.body;
    const cat = await admin_categories_service_1.adminCategoryService.update(id, {
        category_name,
        slug,
        description,
        parent_id,
        is_active,
    });
    return res.json({ data: cat });
});
const remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const force = req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes";
    const result = await admin_categories_service_1.adminCategoryService.remove(id, { force });
    return res.json({ data: result });
});
// const removeHard = TryCatch(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     if (!id) throw new BadRequestException("id is required");
//     const result = await adminCategoryService.remove(id);
//     return res.json({ data: result });
// });
exports.adminCategoryController = {
    list,
    create,
    update,
    remove,
};
