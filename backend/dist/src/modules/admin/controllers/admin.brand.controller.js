"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBrandController = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_brand_service_1 = require("../services/admin.brand.service");
const cloudinary_1 = require("../../../config/cloudinary");
const list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { q, page, limit, status } = req.query;
    const data = await admin_brand_service_1.adminBrandService.list({
        q: q,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status === "active" || status === "inactive" ? status : undefined,
    });
    return res.json({ data });
});
// POST /admin/brands  (multipart/form-data: logo + text fields)
const create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { brand_name, slug, description, is_active } = req.body;
    if (!brand_name) {
        throw new app_errol_1.BadRequestException("brand_name is required");
    }
    // logo optional, nhưng nếu có file thì upload
    let logoUrl;
    let logoId;
    if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.cloudinaryClient.uploader.upload_stream({
                folder: "brands/logos",
                resource_type: "image",
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            });
            stream.end(req.file.buffer);
        });
        logoUrl = uploadResult.secure_url;
        logoId = uploadResult.public_id;
    }
    const brand = await admin_brand_service_1.adminBrandService.create({
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
const update = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const { brand_name, slug, description, is_active } = req.body;
    let logoUrl;
    let logoId;
    if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.cloudinaryClient.uploader.upload_stream({
                folder: "brands/logos",
                resource_type: "image",
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            });
            stream.end(req.file.buffer);
        });
        logoUrl = uploadResult.secure_url;
        logoId = uploadResult.public_id;
    }
    const brand = await admin_brand_service_1.adminBrandService.update(id, {
        brand_name,
        slug,
        description,
        logo_url: logoUrl,
        logo_id: logoId,
        is_active: typeof is_active === "string" ? is_active === "true" : is_active,
    });
    return res.json({ data: brand });
});
// DELETE /admin/brands/:id
const remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const force = req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes";
    const result = await admin_brand_service_1.adminBrandService.remove(id, { force });
    return res.json({ data: result });
});
exports.adminBrandController = {
    list,
    create,
    update,
    remove,
};
