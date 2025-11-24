// src/modules/admin/controllers/admin_brand.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminBrandService } from "../services/admin.brand.service"
import { cloudinaryClient } from "../../../config/cloudinary";

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const list = TryCatch(async (req: Request, res: Response) => {
    const { q, page, limit, status} = req.query;

    const data = await adminBrandService.list({
        q: q as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status === "active" || status === "inactive" ? status : undefined,
    });

    return res.json({ data });
});

// POST /admin/brands  (multipart/form-data: logo + text fields)
const create = TryCatch(async (req: MulterRequest, res: Response) => {
    const { brand_name, slug, description, is_active } = req.body;

    if (!brand_name) {
        throw new BadRequestException("brand_name is required");
    }

    // logo optional, nhưng nếu có file thì upload
    let logoUrl: string | undefined;
    let logoId: string | undefined;

    if (req.file) {
        const uploadResult = await new Promise<{
            secure_url: string;
            public_id: string;
        }>((resolve, reject) => {
            const stream = cloudinaryClient.uploader.upload_stream(
                {
                    folder: "brands/logos",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error || !result) return reject(error);
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            );

            stream.end(req.file!.buffer);
        });

        logoUrl = uploadResult.secure_url;
        logoId = uploadResult.public_id;
    }

    const brand = await adminBrandService.create({
        brand_name,
        slug,
        description,
        logo_url: logoUrl,
        logo_id: logoId,
        is_active: typeof is_active === "string" ? is_active === "true" : !!is_active,
    });

    return res.status(201).json({ data: brand });
});

// PATCH /admin/brands/:id  (optional: có thể cho update logo sau này)
const update = TryCatch(async (req: MulterRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");

    const { brand_name, slug, description, is_active } = req.body;

    let logoUrl: string | undefined;
    let logoId: string | undefined;

    if (req.file) {
        const uploadResult = await new Promise<{
            secure_url: string;
            public_id: string;
        }>((resolve, reject) => {
            const stream = cloudinaryClient.uploader.upload_stream(
                {
                    folder: "brands/logos",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error || !result) return reject(error);
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            );

            stream.end(req.file!.buffer);
        });

        logoUrl = uploadResult.secure_url;
        logoId = uploadResult.public_id;
    }

    const brand = await adminBrandService.update(id, {
        brand_name,
        slug,
        description,
        logo_url: logoUrl,
        logo_id: logoId,
        is_active:
            typeof is_active === "string" ? is_active === "true" : is_active,
    });

    return res.json({ data: brand });
});

// DELETE /admin/brands/:id
const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestException("id is required");
    const force =
        req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes";
    const result = await adminBrandService.remove(id, {force});
    return res.json({ data: result });
});

export const adminBrandController = {
    list,
    create,
    update,
    remove,
};
