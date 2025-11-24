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
exports.adminCategoryService = void 0;
// src/modules/admin/services/admin.category.service.ts
const mongoose_1 = require("mongoose");
const categories_model_1 = require("../../../models/categories.model");
const app_errol_1 = __importStar(require("../../../utils/app_errol"));
const formator_1 = require("../../../utils/formator");
const products_model_1 = require("../../../models/products.model");
exports.adminCategoryService = {
    async list(params) {
        const page = Number(params.page) > 0 ? Number(params.page) : 1;
        const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
        const skip = (page - 1) * limit;
        const filter = {};
        if (params.q) {
            // search theo tên (case-insensitive)
            filter.category_name = { $regex: params.q, $options: "i" };
        }
        if (params.status === "active") {
            filter.is_active = true;
        }
        else if (params.status === "inactive") {
            filter.is_active = false;
        }
        const [items, total] = await Promise.all([
            categories_model_1.Category.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("parent_id", "category_name") // để lấy tên cha
                .lean(),
            categories_model_1.Category.countDocuments(filter),
        ]);
        // map lại cho FE dễ dùng
        const mapped = items.map((cat) => ({
            id: String(cat._id),
            category_name: cat.category_name,
            slug: cat.slug,
            description: cat.description ?? null,
            parent_id: cat.parent_id ? String(cat.parent_id._id) : null,
            parent_name: cat.parent_id
                ? cat.parent_id.category_name
                : null,
            is_active: cat.is_active,
            createdAt: cat.createdAt,
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
        const { category_name, slug, description, parent_id, is_active } = payload;
        if (!category_name) {
            throw new app_errol_1.BadRequestException("category_name is required");
        }
        let parent = null;
        let parentObjectId = null;
        if (parent_id) {
            if (!mongoose_1.Types.ObjectId.isValid(parent_id)) {
                throw new app_errol_1.BadRequestException("Invalid parent_id");
            }
            parent = await categories_model_1.Category.findById(parent_id);
            if (!parent) {
                throw new app_errol_1.BadRequestException("Parent category not found");
            }
            parentObjectId = parent._id;
        }
        const finalSlug = (slug && slug.trim()) || (0, formator_1.slugtify)(category_name);
        try {
            const doc = await categories_model_1.Category.create({
                category_name: category_name.trim(),
                slug: finalSlug,
                description: description ?? null,
                parent_id: parentObjectId,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });
            return doc.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Category slug already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot create category", 500);
        }
    },
    async update(id, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const cat = await categories_model_1.Category.findById(id);
        if (!cat) {
            throw new app_errol_1.NotFoundException("Category not found");
        }
        const { category_name, slug, description, parent_id, is_active } = payload;
        if (category_name !== undefined) {
            cat.category_name = category_name.trim();
        }
        if (slug !== undefined) {
            cat.slug = slug.trim() || (0, formator_1.slugtify)(cat.category_name);
        }
        if (description !== undefined) {
            cat.description = description ?? null;
        }
        if (typeof is_active === "boolean") {
            cat.is_active = is_active;
        }
        if (parent_id !== undefined) {
            if (parent_id === null || parent_id === "") {
                cat.parent_id = null;
            }
            else {
                if (!mongoose_1.Types.ObjectId.isValid(parent_id)) {
                    throw new app_errol_1.BadRequestException("Invalid parent_id");
                }
                if (String(cat._id) === String(parent_id)) {
                    throw new app_errol_1.BadRequestException("Category cannot be parent of itself");
                }
                const parent = await categories_model_1.Category.findById(parent_id);
                if (!parent) {
                    throw new app_errol_1.BadRequestException("Parent category not found");
                }
                cat.parent_id = parent._id;
            }
        }
        try {
            await cat.save();
            return cat.toObject();
        }
        catch (err) {
            if (err.code === 11000) {
                throw new app_errol_1.BadRequestException("Category slug already exists");
            }
            throw new app_errol_1.default(err.message || "Cannot update category", 500);
        }
    },
    async remove(id, options) {
        const { force } = options;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new app_errol_1.BadRequestException("Invalid id");
        }
        const cat = await categories_model_1.Category.findById(id);
        if (!cat) {
            throw new app_errol_1.NotFoundException("Category not found");
        }
        // ========== SOFT DELETE ==========
        if (!force) {
            if (!cat.is_active) {
                return { success: true, softDeleted: true };
            }
            cat.is_active = false;
            await cat.save();
            return { success: true, softDeleted: true };
        }
        // ========== HARD DELETE ==========
        // 1) Check còn category con không
        const childCount = await categories_model_1.Category.countDocuments({ parent_id: cat._id });
        if (childCount > 0) {
            throw new app_errol_1.BadRequestException("Không thể xoá vĩnh viễn danh mục vì vẫn còn danh mục con sử dụng danh mục này");
        }
        // 2) Check còn product nào dùng category này không
        const productCount = await products_model_1.Product.countDocuments({ category_id: cat._id });
        if (productCount > 0) {
            throw new app_errol_1.BadRequestException("Không thể xoá vĩnh viễn danh mục vì vẫn còn sản phẩm đang sử dụng danh mục này");
        }
        // 3) Xoá hẳn category
        await categories_model_1.Category.deleteOne({ _id: cat._id });
        return { success: true, deleted: true };
    },
};
