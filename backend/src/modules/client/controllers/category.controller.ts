import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { categoryService } from "../services/category.service";

const listCategories = TryCatch(async (req: Request, res: Response) => {
    const { active, tree } = req.query;

    const data = await categoryService.listCategories({
        active: active === "1",
        tree: tree === "1",
    });

    return res.json({ data });
});
export const categoryController = {
    listCategories
}

