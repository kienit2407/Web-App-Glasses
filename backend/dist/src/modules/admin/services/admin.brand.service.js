"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBrandService = void 0;
// src/modules/admin/services/admin.brand.service.ts
const mongoose_1 = require("mongoose");
const brands_model_1 = require("../../../models/brands.model");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
const formator_1 = require("../../../utils/formator");
const cloudinary_1 = require("../../../config/cloudinary");
const products_model_1 = require("../../../models/products.model");
exports.adminBrandService = {
    async list(params) {
        const page = Number(params.page) > 0 ? Number(params.page) : 1;
        const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
        const skip = (page - 1) * limit;
        const filter = {};
        if (params.q) {
            filter.brand_name = { $regex: params.q, $options: "i" };
        }
        if (params.status === "active") {
            filter.is_active = true;
        }
        else if (params.status === "inactive") {
            filter.is_active = false;
        }
        const [items, total] = await Promise.all([
            brands_model_1.Brand.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            brands_model_1.Brand.countDocuments(filter),
        ]);
        const mapped = items.map((b) => ({
            id: String(b._id),
            brand_name: b.brand_name,
            slug: b.slug,
            description: b.description ?? null,
            logo_url: b.logo_url ?? null,
            logo_id: b.logo_id ?? null,
            is_active: b.is_active,
            createdAt: b.createdAt,
        }));
        return {
            items: mapped,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
    async create(payload) {
        const { brand_name, slug, description, logo_url, logo_id, is_active } = payload;
        if (!brand_name) {
            throw new app_errol_1.BadRequestException("brand_name is required");
        }
        const finalSlug = (slug && slug.trim()) || (0, formator_1.slugtify)(brand_name);
        try {
            const doc = await brands_model_1.Brand.create({
                brand_name: brand_name.trim(),
                slug: finalSlug,
                description: description ?? null,
                logo_url: logo_url ?? null,
                logo_id: logo_id ?? null,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });
            return doc.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Brand slug already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot create brand", 500);
        }
    },
    async update(id, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const brand = await brands_model_1.Brand.findById(id);
        if (!brand) {
            throw new app_errol_1.NotFoundException("Brand not found");
        }
        const { brand_name, slug, description, logo_url, logo_id, is_active } = payload;
        if (brand_name !== undefined) {
            brand.brand_name = brand_name.trim();
        }
        if (slug !== undefined) {
            brand.slug = slug.trim() || (0, formator_1.slugtify)(brand.brand_name);
        }
        if (description !== undefined) {
            brand.description = description ?? null;
        }
        if (logo_url !== undefined) {
            brand.logo_url = logo_url;
        }
        if (logo_id !== undefined) {
            brand.logo_id = logo_id;
        }
        if (typeof is_active === "boolean") {
            brand.is_active = is_active;
        }
        try {
            await brand.save();
            return brand.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Brand slug already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot update brand", 500);
        }
    },
    async remove(id, options = { force: false }) {
        const { force } = options;
        console.log("[REMOVE BRAND] id =", id, "force =", force);
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const brand = await brands_model_1.Brand.findById(id);
        if (!brand) {
            throw new app_errol_1.NotFoundException("Brand not found");
        }
        // ========== SOFT DELETE ==========
        if (!force) {
            // chỉ tắt is_active, KHÔNG xoá logo để còn khôi phục
            if (!brand.is_active) {
                // đã tắt rồi thì trả luôn
                return { success: true, softDeleted: true };
            }
            brand.is_active = false;
            await brand.save();
            return { success: true, softDeleted: true };
        }
        // ========== HARD DELETE ==========
        // 1) Check xem còn product nào dùng brand này không
        const productCount = await products_model_1.Product.countDocuments({ brand_id: brand._id });
        if (productCount > 0) {
            throw new app_errol_1.BadRequestException("Không thể xoá vĩnh viễn thương hiệu vì vẫn còn sản phẩm đang sử dụng thương hiệu này");
        }
        // 2) Xoá logo trên Cloudinary (nếu có)
        if (brand.logo_id) {
            try {
                await cloudinary_1.cloudinaryClient.uploader.destroy(brand.logo_id);
            }
            catch (e) {
                console.error("Failed to delete brand logo from Cloudinary:", e);
                // không throw để tránh kẹt xoá DB vì lỗi Cloudinary
            }
        }
        // 3) Xoá hẳn brand khỏi DB
        await brands_model_1.Brand.deleteOne({ _id: brand._id });
        return { success: true, deleted: true };
    },
};
