"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductController = exports.listVariantImages = exports.listVariants = exports.deleteImage = exports.reorderVariantImages = exports.upsertVariantImage = exports.removeVariant = exports.updateVariant = exports.createVariant = exports.remove = exports.update = exports.variantDetail = exports.detail = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_product_service_1 = require("../services/admin.product.service");
const cloudinary_helper_1 = require("../../../utils/cloudinary.helper");
const cloudinary_1 = require("../../../config/cloudinary");
const mongoose_1 = require("mongoose");
const product_variants_model_1 = require("../../../models/product.variants.model");
const products_model_1 = require("../../../models/products.model");
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { q, status, page = "1", limit = "10" } = req.query;
    // ép kiểu & validate nhẹ
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    let statusFilter;
    if (status === "active" || status === "inactive" || status === "draft") {
        statusFilter = status;
    }
    const data = await admin_product_service_1.adminProductService.listProducts({
        q: q ? String(q) : undefined,
        status: statusFilter,
        page: pageNum,
        limit: limitNum,
    });
    return res.json({ data });
});
exports.detail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const product = await products_model_1.Product.findById(id).lean();
    if (!product)
        throw new app_errol_1.NotFoundException("Product not found");
    const variantCount = await product_variants_model_1.ProductVariant.countDocuments({ product_id: id });
    const data = await admin_product_service_1.adminProductService.getProductDetail(id);
    return res.json({
        data: {
            product,
            variant_count: variantCount,
        },
    });
});
exports.variantDetail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { variantId } = req.params;
    if (!mongoose_1.Types.ObjectId.isValid(variantId)) {
        throw new app_errol_1.BadRequestException("Invalid variantId");
    }
    const variant = await product_variants_model_1.ProductVariant.findById(variantId).lean();
    if (!variant)
        throw new app_errol_1.NotFoundException("Variant not found");
    return res.json({ data: variant });
});
const create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { product_name, description, origin_country, category_id, brand_id, for_gender, is_active, } = req.body;
    if (!product_name || !description || !category_id || !brand_id) {
        throw new app_errol_1.BadRequestException("product_name, description, category_id, brand_id are required");
    }
    // tags gửi lên dạng JSON string (từ FormData)
    let tags;
    if (req.body.tags) {
        try {
            tags = JSON.parse(req.body.tags);
        }
        catch (e) {
            throw new app_errol_1.BadRequestException("tags is not valid JSON");
        }
    }
    // file thumbnail bắt buộc
    if (!req.file) {
        throw new app_errol_1.BadRequestException("thumbnail file is required");
    }
    const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "products/thumbnails");
    const product = await admin_product_service_1.adminProductService.createProduct({
        product_name,
        description,
        tags,
        thumbnail_url: secure_url,
        thumbnail_id: public_id,
        origin_country: origin_country ?? null,
        category_id,
        brand_id,
        for_gender,
        is_active: false
    });
    return res.status(201).json({ data: product });
});
// PATCH /admin/products/:id
exports.update = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const { product_name, slug, description, origin_country, category_id, for_gender, brand_id, is_active, } = req.body;
    // tags gửi lên dạng JSON string (từ FormData)
    let tags;
    if (req.body.tags) {
        try {
            tags = JSON.parse(req.body.tags);
        }
        catch (e) {
            throw new app_errol_1.BadRequestException("tags is not valid JSON");
        }
    }
    // 2) Xử lý thumbnail mới (nếu có)
    let thumbnail_url;
    let thumbnail_id;
    if (req.file) {
        // vì dùng upload.single("thumbnail") nên CHẮC CHẮN chỉ có 1 file
        const { secure_url, public_id } = await (0, cloudinary_helper_1.uploadImageBuffer)(req.file.buffer, "products/thumbnails");
        thumbnail_url = secure_url;
        thumbnail_id = public_id;
    }
    // / Convert is_active từ string -> boolean
    let parsedIsActive;
    if (typeof is_active === "string") {
        if (is_active === "true")
            parsedIsActive = true;
        else if (is_active === "false")
            parsedIsActive = false;
        else
            parsedIsActive = undefined; // giá trị rác thì bỏ qua
    }
    else if (typeof is_active === "boolean") {
        parsedIsActive = is_active;
    }
    const product = await admin_product_service_1.adminProductService.updateProduct(id, {
        product_name,
        slug,
        description,
        tags,
        for_gender,
        thumbnail_url,
        thumbnail_id,
        origin_country,
        category_id,
        brand_id,
        is_active: parsedIsActive,
    });
    return res.json({ data: product });
});
// DELETE /admin/products/:id
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const force = req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes";
    if (!id)
        throw new app_errol_1.BadRequestException("id is required");
    const result = await admin_product_service_1.adminProductService.removeProduct(id, { force });
    return res.json({ data: result });
});
// ===== VARIANTS =====
// POST /admin/products/:id/variants
exports.createVariant = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("product id is required");
    const variant = await admin_product_service_1.adminProductService.createVariant(id, req.body);
    return res.status(201).json({ data: variant });
});
// PATCH /admin/products/variants/:variantId
exports.updateVariant = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { variantId } = req.params;
    if (!variantId)
        throw new app_errol_1.BadRequestException("variantId is required");
    const variant = await admin_product_service_1.adminProductService.updateVariant(variantId, req.body);
    return res.json({ data: variant });
});
// DELETE /admin/products/variants/:variantId
exports.removeVariant = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { variantId } = req.params;
    const force = req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes";
    if (!variantId)
        throw new app_errol_1.BadRequestException("variantId is required");
    const result = await admin_product_service_1.adminProductService.removeVariant(variantId, { force });
    return res.json({ data: result });
});
// ===== IMAGES =====
// POST /admin/products/:id/variants/:variantId/images
exports.upsertVariantImage = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id, variantId } = req.params;
    if (!id || !mongoose_1.Types.ObjectId.isValid(id))
        throw new app_errol_1.BadRequestException("Invalid product id");
    if (!variantId || !mongoose_1.Types.ObjectId.isValid(variantId))
        throw new app_errol_1.BadRequestException("Invalid variant id");
    const files = req.files || [];
    if (!files.length) {
        throw new app_errol_1.BadRequestException("No images uploaded");
    }
    // 1) Tính position bắt đầu (lấy max position hiện có của product)
    const startPos = await admin_product_service_1.adminProductService.getNextImagePositionForProduct(id);
    // 2) Upload tất cả file lên Cloudinary (song song)
    const uploads = await Promise.all(files.map((file, idx) => new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinaryClient.uploader.upload_stream({
            folder: `products/variants/${variantId}`,
            resource_type: "image",
        }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                position: startPos + idx, // gán thứ tự liên tục
            });
        });
        stream.end(file.buffer);
    })));
    // 3) Lưu DB (bulk) -> bảng ProductImage
    const saved = await admin_product_service_1.adminProductService.addVariantImages(id, variantId, uploads);
    return res.status(201).json({ data: saved });
});
// PATCH /admin/products/variants/:variantId/images/reorder
exports.reorderVariantImages = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { variantId } = req.params;
    console.log("🔁 Reorder images variantId =", variantId);
    console.log("🔁 Body =", JSON.stringify(req.body, null, 2));
    if (!variantId)
        throw new app_errol_1.BadRequestException("variantId is required");
    const { items } = req.body;
    if (!Array.isArray(items)) {
        throw new app_errol_1.BadRequestException("items must be an array");
    }
    const result = await admin_product_service_1.adminProductService.reorderVariantImages(variantId, items);
    return res.json({ data: result });
});
// DELETE /admin/products/images/:imageId
exports.deleteImage = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { imageId } = req.params;
    if (!imageId)
        throw new app_errol_1.BadRequestException("imageId is required");
    const result = await admin_product_service_1.adminProductService.deleteImage(imageId);
    return res.json({ data: result });
});
exports.listVariants = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new app_errol_1.BadRequestException("product id is required");
    const variants = await admin_product_service_1.adminProductService.getVariantsByProduct(id);
    return res.json({ data: { items: variants } });
});
exports.listVariantImages = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { variantId } = req.params;
    if (!variantId)
        throw new app_errol_1.BadRequestException("variantId is required");
    const items = await admin_product_service_1.adminProductService.getVariantImages(variantId);
    return res.json({ data: { items } });
});
exports.adminProductController = {
    create,
    update: exports.update,
    remove: exports.remove,
    createVariant: exports.createVariant,
    listVariants: exports.listVariants,
    list: exports.list,
    updateVariant: exports.updateVariant,
    removeVariant: exports.removeVariant,
    listVariantImages: exports.listVariantImages,
    upsertVariantImage: exports.upsertVariantImage,
    reorderVariantImages: exports.reorderVariantImages,
    deleteImage: exports.deleteImage,
    detail: exports.detail,
    variantDetail: exports.variantDetail
};
