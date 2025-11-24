// src/controllers/geo.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { geoService } from "../services/geo.service";

// GET /geo/provinces
export const provinces = TryCatch(async (req: Request, res: Response) => {
    const data = await geoService.listProvinces();
    return res.json({ data });
});

// GET /geo/districts?province_code=...
export const districts = TryCatch(async (req: Request, res: Response) => {
    const { province_code } = req.query;

    if (!province_code || typeof province_code !== "string") {
        throw new BadRequestException("province_code is required");
    }

    const data = await geoService.listDistricts(province_code);
    return res.json({ data });
});

// GET /geo/wards?district_code=...
export const wards = TryCatch(async (req: Request, res: Response) => {
    const { district_code } = req.query;

    if (!district_code || typeof district_code !== "string") {
        throw new BadRequestException("district_code is required");
    }

    const data = await geoService.listWards(district_code);
    return res.json({ data });
});

export const geoController = {
    provinces,
    districts,
    wards,
};
