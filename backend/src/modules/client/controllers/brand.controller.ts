// src/controllers/brand.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { brandService } from "../services/brand.service";

export const list = TryCatch(async (req: Request, res: Response) => {
    const { active } = req.query;

    const brands = await brandService.listBrands({
        active: active === "1",
    });

    return res.json({ data: brands });
});

export const brandController = {
    list,
};
