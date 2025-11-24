// src/modules/admin/services/admin.category.service.ts
import { Types } from "mongoose";
import { Category, ICategory } from "../../../models/categories.model";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";
import { slugtify } from "../../../utils/formator";
import { Product } from "../../../models/products.model";

interface ListCategoriesParams {
    q?: string;
    page?: number;
    limit?: number;
    status?: "active" | "inactive"
}

interface CreateCategoryPayload {
    category_name: string;
    slug?: string;
    description?: string | null;
    parent_id?: string | null;
    is_active?: boolean;
}

interface UpdateCategoryPayload {
    category_name?: string;
    slug?: string;
    description?: string | null;
    parent_id?: string | null;
    is_active?: boolean;
}
interface RemoveCategoryOptions {
    force?: boolean;
}

export const adminCategoryService = {
    async list(params: ListCategoriesParams) {
        const page = Number(params.page) > 0 ? Number(params.page) : 1;
        const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (params.q) {
            // search theo tên (case-insensitive)
            filter.category_name = { $regex: params.q, $options: "i" };
        }
        if (params.status === "active") {
            filter.is_active = true;
        } else if (params.status === "inactive") {
            filter.is_active = false;
        }

        const [items, total] = await Promise.all([
            Category.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("parent_id", "category_name") // để lấy tên cha
                .lean(),
            Category.countDocuments(filter),
        ]);

        // map lại cho FE dễ dùng
        const mapped = items.map((cat) => ({
            id: String(cat._id),
            category_name: cat.category_name,
            slug: cat.slug,
            description: cat.description ?? null,
            parent_id: cat.parent_id ? String((cat.parent_id as any)._id) : null,
            parent_name: cat.parent_id
                ? (cat.parent_id as any).category_name
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

    async create(payload: CreateCategoryPayload) {
        const { category_name, slug, description, parent_id, is_active } = payload;

        if (!category_name) {
            throw new BadRequestException("category_name is required");
        }

        let parent: ICategory | null = null;
        let parentObjectId: Types.ObjectId | null = null;

        if (parent_id) {
            if (!Types.ObjectId.isValid(parent_id)) {
                throw new BadRequestException("Invalid parent_id");
            }
            parent = await Category.findById(parent_id);
            if (!parent) {
                throw new BadRequestException("Parent category not found");
            }
            parentObjectId = parent._id;
        }

        const finalSlug = (slug && slug.trim()) || slugtify(category_name);

        try {
            const doc = await Category.create({
                category_name: category_name.trim(),
                slug: finalSlug,
                description: description ?? null,
                parent_id: parentObjectId,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });

            return doc.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Category slug already exists");
            }
            throw new AppError(err.message || "Cannot create category", 500);
        }
    },

    async update(id: string, payload: UpdateCategoryPayload) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const cat = await Category.findById(id);
        if (!cat) {
            throw new NotFoundException("Category not found");
        }

        const { category_name, slug, description, parent_id, is_active } = payload;

        if (category_name !== undefined) {
            cat.category_name = category_name.trim();
        }

        if (slug !== undefined) {
            cat.slug = slug.trim() || slugtify(cat.category_name);
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
            } else {
                if (!Types.ObjectId.isValid(parent_id)) {
                    throw new BadRequestException("Invalid parent_id");
                }
                if (String(cat._id) === String(parent_id)) {
                    throw new BadRequestException("Category cannot be parent of itself");
                }
                const parent = await Category.findById(parent_id);
                if (!parent) {
                    throw new BadRequestException("Parent category not found");
                }
                cat.parent_id = parent._id;
            }
        }

        try {
            await cat.save();
            return cat.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Category slug already exists");
            }
            throw new AppError(err.message || "Cannot update category", 500);
        }
    },

    async remove(id: string, options: RemoveCategoryOptions) {
        const { force } = options
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const cat = await Category.findById(id);
        if (!cat) {
            throw new NotFoundException("Category not found");
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
        const childCount = await Category.countDocuments({ parent_id: cat._id });
        if (childCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn danh mục vì vẫn còn danh mục con sử dụng danh mục này"
            );
        }

        // 2) Check còn product nào dùng category này không
        const productCount = await Product.countDocuments({ category_id: cat._id });
        if (productCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn danh mục vì vẫn còn sản phẩm đang sử dụng danh mục này"
            );
        }

        // 3) Xoá hẳn category
        await Category.deleteOne({ _id: cat._id });

        return { success: true, deleted: true };
    },
};
