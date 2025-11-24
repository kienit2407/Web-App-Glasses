// src/modules/admin/controllers/admin_category.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminCategoryService } from "../services/admin.categories.service";

const list = TryCatch(async (req: Request, res: Response) => {
    const { q, page, limit, status } = req.query;

    const data = await adminCategoryService.list({
        q: q as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status === "active" || status === "inactive" ? status : undefined,
    });

    return res.json({ data });
});

const create = TryCatch(async (req: Request, res: Response) => {
    const { category_name, slug, description, parent_id, is_active } = req.body;

    const cat = await adminCategoryService.create({
        category_name,
        slug,
        description,
        parent_id,
        is_active,
    });

    return res.status(201).json({ data: cat });
});

const update = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const { category_name, slug, description, parent_id, is_active } = req.body;

    const cat = await adminCategoryService.update(id, {
        category_name,
        slug,
        description,
        parent_id,
        is_active,
    });

    return res.json({ data: cat });
});

const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");
    const force =
        req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes"
    const result = await adminCategoryService.remove(id, {force});
    return res.json({ data: result });
});

// const removeHard = TryCatch(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     if (!id) throw new BadRequestException("id is required");

//     const result = await adminCategoryService.remove(id);
//     return res.json({ data: result });
// });

export const adminCategoryController = {
    list,
    create,
    update,
    remove,
};
