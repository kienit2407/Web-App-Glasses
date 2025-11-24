// src/modules/admin/services/admin.brand.service.ts
import { Types } from "mongoose";
import { Brand, IBrand } from "../../../models/brands.model";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";
import { slugtify } from "../../../utils/formator";
import { cloudinaryClient } from "../../../config/cloudinary";
import { Product } from "../../../models/products.model";

interface ListBrandsParams {
    q?: string;
    page?: number;
    limit?: number;
    status?: "active" | "inactive"
}
interface RemoveBrandOptions {
    force?: boolean;
}

interface CreateBrandPayload {
    brand_name: string;
    slug?: string;
    description?: string | null;
    logo_url?: string | null;
    logo_id?: string | null;
    is_active?: boolean;
}

interface UpdateBrandPayload {
    brand_name?: string;
    slug?: string;
    description?: string | null;
    logo_url?: string | null;
    logo_id?: string | null;
    is_active?: boolean;
}

export const adminBrandService = {
    async list(params: ListBrandsParams) {
        const page = Number(params.page) > 0 ? Number(params.page) : 1;
        const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (params.q) {
            filter.brand_name = { $regex: params.q, $options: "i" };
        }
        if (params.status === "active") {
            filter.is_active = true;
        } else if (params.status === "inactive") {
            filter.is_active = false;
        }

        const [items, total] = await Promise.all([
            Brand.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Brand.countDocuments(filter),
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

    async create(payload: CreateBrandPayload) {
        const { brand_name, slug, description, logo_url, logo_id, is_active } = payload;

        if (!brand_name) {
            throw new BadRequestException("brand_name is required");
        }

        const finalSlug = (slug && slug.trim()) || slugtify(brand_name);

        try {
            const doc = await Brand.create({
                brand_name: brand_name.trim(),
                slug: finalSlug,
                description: description ?? null,
                logo_url: logo_url ?? null,
                logo_id: logo_id ?? null,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });

            return doc.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Brand slug already exists");
            }
            throw new AppError(err.message || "Cannot create brand", 500);
        }
    },

    async update(id: string, payload: UpdateBrandPayload) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const brand = await Brand.findById(id);
        if (!brand) {
            throw new NotFoundException("Brand not found");
        }

        const { brand_name, slug, description, logo_url, logo_id, is_active } = payload;

        if (brand_name !== undefined) {
            brand.brand_name = brand_name.trim();
        }

        if (slug !== undefined) {
            brand.slug = slug.trim() || slugtify(brand.brand_name);
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
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Brand slug already exists");
            }
            throw new AppError(err.message || "Cannot update brand", 500);
        }
    },

    async remove(id: string, options: RemoveBrandOptions = { force: false }) {
        const { force } = options
        console.log("[REMOVE BRAND] id =", id, "force =", force);
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid id");
        }

        const brand = await Brand.findById(id);
        if (!brand) {
            throw new NotFoundException("Brand not found");
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
        const productCount = await Product.countDocuments({ brand_id: brand._id });

        if (productCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn thương hiệu vì vẫn còn sản phẩm đang sử dụng thương hiệu này"
            );
        }

        // 2) Xoá logo trên Cloudinary (nếu có)
        if (brand.logo_id) {
            try {
                await cloudinaryClient.uploader.destroy(brand.logo_id);
            } catch (e) {
                console.error("Failed to delete brand logo from Cloudinary:", e);
                // không throw để tránh kẹt xoá DB vì lỗi Cloudinary
            }
        }

        // 3) Xoá hẳn brand khỏi DB
        await Brand.deleteOne({ _id: brand._id });

        return { success: true, deleted: true };
    },
};
