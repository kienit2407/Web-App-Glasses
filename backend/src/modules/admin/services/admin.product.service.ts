import { PipelineStage, Types } from "mongoose";
import { Product, IProduct } from "../../../models/products.model";
import { ProductVariant, IProductVariant } from "../../../models/product.variants.model";
import { ProductImage, IProductImage } from "../../../models/products.image.model";
import { Category } from "../../../models/categories.model";
import { Brand } from "../../../models/brands.model";
import AppError, {
    BadRequestException,
    NotFoundException,
} from "../../../utils/app_errol";
import { slugtify } from "../../../utils/formator";
import { cloudinaryClient } from "../../../config/cloudinary";
import { OrderItem } from "../../../models/orders.item.model";
interface RemoveVariantOptions {
    force?: boolean;
}
interface CreateProductPayload {
    product_name: string;
    slug?: string;
    description: string;
    tags?: string[];
    for_gender: "male" | "female" | "unisex" | "kids";
    thumbnail_url: string;
    thumbnail_id: string;
    origin_country?: string | null;
    category_id: string;
    brand_id: string;
    is_active?: boolean;
}

interface RemoveOptions {
    force?: boolean;
}
interface UpdateProductPayload {
    product_name?: string;
    slug?: string;
    description?: string;
    tags?: string[];
    thumbnail_url?: string | null;
    for_gender: "male" | "female" | "unisex" | "kids";
    thumbnail_id?: string | null;
    origin_country?: string | null;
    category_id?: string;
    brand_id?: string;
    is_active?: boolean;
}

interface CreateVariantPayload {
    sku_variant: string;
    frame_material: string;
    frame_color: string;
    frame_shape: string;
    lens_width: string;
    lens_height: string;
    temple_length: string;
    bridge_width: string;
    stock: number;
    has_uv_protection?: boolean;
    price: number;
    sale_price?: number | null;
    is_active?: boolean;
}

interface UpdateVariantPayload {
    sku_variant?: string;
    frame_material?: string;
    frame_color?: string;
    frame_shape?: string;
    lens_width?: string;
    lens_height?: string;
    temple_length?: string;
    bridge_width?: string;
    stock?: number;
    has_uv_protection?: boolean;
    price?: number;
    sale_price?: number | null;
    is_active?: boolean;
}
interface ListProductsOptions {
    status?: "active" | "inactive" | "draft";
    q?: string;
    page?: number;
    limit?: number;
}
interface UpsertVariantImagePayload {
    url: string;
    url_id: string;
    position: number; // 0..n
}
export const adminProductService = {
    async getProductDetail(productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product id");
        }

        // join category + brand
        const agg = await Product.aggregate([
            { $match: { _id: new Types.ObjectId(productId) } },
            { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category" } },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "brands", localField: "brand_id", foreignField: "_id", as: "brand" } },
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    product_name: 1,
                    slug: 1,
                    description: 1,
                    tags: 1,
                    thumbnail_url: 1,
                    is_active: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    origin_country: 1,
                    category_id: "$category._id",
                    brand_id: "$brand._id",
                    category_name: "$category.category_name",
                    brand_name: "$brand.brand_name",
                }
            }
        ]);

        const product = agg[0];
        if (!product) throw new NotFoundException("Product not found");

        // fetch variants riêng (nhẹ + dễ paginate sau này)
        const variants = await ProductVariant.find({ product_id: product._id })
            .select("_id sku_variant frame_material frame_color frame_shape price stock is_active")
            .lean();

        return {
            product: {
                ...product,
                id: product._id, // FE dễ dùng
            },
            variants,
        };
    },
    async getNextImagePositionForProduct(productId: string): Promise<number> {
        const pid = new Types.ObjectId(productId);
        const agg = await ProductImage.aggregate([
            { $match: { product_id: pid } },
            { $group: { _id: null, maxPos: { $max: "$position" } } },
        ]);

        const maxPos = agg.length ? agg[0].maxPos ?? -1 : -1;
        return maxPos + 1; // vị trí kế tiếp
    },

    // Lưu nhiều ảnh cho 1 variant (đã có url/public_id/position)
    async addVariantImages(
        productId: string,
        variantId: string,
        items: { secure_url: string; public_id: string; position: number }[]
    ) {
        const pid = new Types.ObjectId(productId);
        const vid = new Types.ObjectId(variantId);

        // Valid product & variant & thuộc về cùng product
        const [product, variant] = await Promise.all([
            Product.findById(pid).lean(),
            ProductVariant.findById(vid).lean(),
        ]);
        if (!product) throw new NotFoundException("Product not found");
        if (!variant) throw new NotFoundException("Variant not found");
        if (String(variant.product_id) !== String(product._id)) {
            throw new BadRequestException("Variant does not belong to product");
        }

        // bulkWrite theo (product_id, position) là unique (nếu bạn tạo index unique đó)
        const ops = items.map((it) => ({
            updateOne: {
                filter: { product_id: pid, position: it.position },
                update: {
                    $set: {
                        product_id: pid,
                        variant_id: vid,
                        url: it.secure_url,
                        url_id: it.public_id,
                        position: it.position,
                    },
                },
                upsert: true,
            },
        }));

        await ProductImage.bulkWrite(ops);
        // trả lại list theo position
        const saved = await ProductImage.find({ product_id: pid, variant_id: vid })
            .sort({ position: 1 })
            .lean();

        return saved;
    },
    async getVariantsByProduct(productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product id");
        }
        const variants = await ProductVariant.find({ product_id: productId }).lean();
        return variants;
    },
    async listProducts(opts: ListProductsOptions) {
        const { status, q, page = 1, limit = 10 } = opts;

        const skip = (page - 1) * limit;

        // $match đầu tiên: chỉ áp dụng các filter có thể dùng ngay (vd: search)
        const preMatch: any = {};
        if (q) {
            preMatch.product_name = { $regex: q, $options: "i" };
        }

        // build pipeline
        const pipeline: PipelineStage[] = [
            { $match: preMatch },

            // join category
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

            // join brand
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand",
                },
            },
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

            // join variants để tính total_stock & variant_count
            {
                $lookup: {
                    from: "product_variants",
                    localField: "_id",
                    foreignField: "product_id",
                    as: "variants",
                },
            },
            {
                $addFields: {
                    total_stock: { $sum: "$variants.stock" },
                    variant_count: { $size: "$variants" },
                },
            },
        ];

        // $match theo status sau khi đã có variant_count
        if (status === "active") {
            pipeline.push({ $match: { is_active: true } });
        } else if (status === "draft") {
            pipeline.push({ $match: { is_active: false, variant_count: { $eq: 0 } } });
        } else if (status === "inactive") {
            pipeline.push({ $match: { is_active: false, variant_count: { $gt: 0 } } });
        }

        // project về shape FE cần
        pipeline.push(
            {
                $project: {
                    _id: 0,
                    id: "$_id",
                    thumbnail_url: 1,
                    product_name: 1,
                    slug: 1,
                    selled_amount: 1,
                    is_active: 1,
                    for_gender: 1,
                    createdAt: 1,
                    total_stock: 1,
                    category_name: "$category.category_name",
                    brand_name: "$brand.brand_name",
                    // useful khi debug:
                    // variant_count: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        // đếm total phải dùng cùng điều kiện với pipeline status
        const countPipeline: PipelineStage[] = [
            { $match: preMatch },
            {
                $lookup: {
                    from: "product_variants",
                    localField: "_id",
                    foreignField: "product_id",
                    as: "variants",
                },
            },
            { $addFields: { variant_count: { $size: "$variants" } } },
        ];
        if (status === "active") {
            countPipeline.push({ $match: { is_active: true } });
        } else if (status === "draft") {
            countPipeline.push({ $match: { is_active: false, variant_count: { $eq: 0 } } });
        } else if (status === "inactive") {
            countPipeline.push({ $match: { is_active: false, variant_count: { $gt: 0 } } });
        }
        countPipeline.push({ $count: "total" });

        const [items, countArr] = await Promise.all([
            Product.aggregate(pipeline),
            Product.aggregate(countPipeline),
        ]);
        const total = countArr?.[0]?.total ?? 0;

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async createProduct(payload: CreateProductPayload) {
        const {
            product_name,
            slug,
            description,
            tags = [],
            thumbnail_url,
            thumbnail_id,
            for_gender,
            origin_country,
            category_id,
            brand_id,
            is_active,
        } = payload;

        if (!product_name || !description || !thumbnail_url || !thumbnail_id) {
            throw new BadRequestException("product_name, description, thumbnail_url, thumbnail_id are required");
        }

        if (!Types.ObjectId.isValid(category_id)) {
            throw new BadRequestException("Invalid category_id");
        }
        if (!Types.ObjectId.isValid(brand_id)) {
            throw new BadRequestException("Invalid brand_id");
        }

        const [category, brand] = await Promise.all([
            Category.findById(category_id).lean(),
            Brand.findById(brand_id).lean(),
        ]);

        if (!category) throw new BadRequestException("Category not found");
        if (!brand) throw new BadRequestException("Brand not found");

        const finalSlug = (slug && slug.trim()) || slugtify(product_name);

        try {
            const product = await Product.create({
                product_name: product_name.trim(),
                slug: finalSlug,
                selled_amount: 0,
                review_count: 0,
                rating_avg: 0,
                description: description.trim(),
                tags,
                for_gender,
                thumbnail_url: thumbnail_url.trim(),
                thumbnail_id: thumbnail_id.trim(),
                origin_country: origin_country ?? null,
                category_id: new Types.ObjectId(category_id),
                brand_id: new Types.ObjectId(brand_id),
                is_active: typeof is_active === "boolean" ? is_active : true,
            });

            return product.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Product slug already exists");
            }
            throw new AppError(err.message || "Cannot create product", 500);
        }
    },

    async updateProduct(productId: string, payload: UpdateProductPayload) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid id");
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        const {
            product_name,
            slug,
            description,
            for_gender,
            tags,
            thumbnail_url,
            thumbnail_id,
            origin_country,
            category_id,
            brand_id,
            is_active,
        } = payload;

        if (product_name !== undefined) {
            product.product_name = product_name.trim();
        }

        if (slug !== undefined) {
            product.slug = slug.trim() || slugtify(product.product_name);
        }

        if (description !== undefined) {
            product.description = description.trim();
        }

        if (tags !== undefined) {
            product.tags = tags;
        }
        if (for_gender !== undefined) {
            product.for_gender = for_gender;
        }
        if (thumbnail_url !== undefined) {
            product.thumbnail_url = thumbnail_url;
        }

        // thumbnail mới
        if (thumbnail_url !== undefined && thumbnail_id !== undefined) {
            // nếu có thumbnail cũ thì xóa khỏi Cloudinary
            if (product.thumbnail_id && product.thumbnail_id !== thumbnail_id) {
                try {
                    await cloudinaryClient.uploader.destroy(product.thumbnail_id);
                } catch (e) {
                    console.error("Failed to delete old thumbnail:", e);
                }
            }

            product.thumbnail_url = thumbnail_url;
            product.thumbnail_id = thumbnail_id;
        }

        if (origin_country !== undefined) {
            product.origin_country = origin_country ?? null;
        }
        // pghaafn kiểm tra variant để xem cho mở bán hay không
        if (typeof is_active === "boolean") {
            if (is_active === true) {
                // Check xem sản phẩm này có variant nào chưa
                const variantCount = await ProductVariant.countDocuments({
                    product_id: product._id,
                    is_active: true,    // hoặc chỉ cần tồn tại variant
                });

                if (variantCount === 0) {
                    throw new BadRequestException(
                        "Sản phẩm nên có ít nhất 1 biến thể hoặc hoạt động trước khi đăng bán"
                    );
                }
            }

            product.is_active = is_active;
        }

        if (category_id !== undefined) {
            if (!Types.ObjectId.isValid(category_id)) {
                throw new BadRequestException("Invalid category_id");
            }
            const cat = await Category.findById(category_id).lean();
            if (!cat) throw new BadRequestException("Category not found");
            product.category_id = new Types.ObjectId(category_id);
        }

        if (brand_id !== undefined) {
            if (!Types.ObjectId.isValid(brand_id)) {
                throw new BadRequestException("Invalid brand_id");
            }
            const brand = await Brand.findById(brand_id).lean();
            if (!brand) throw new BadRequestException("Brand not found");
            product.brand_id = new Types.ObjectId(brand_id);
        }

        try {
            await product.save();
            return product.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("Product slug already exists");
            }
            throw new AppError(err.message || "Cannot update product", 500);
        }
    },


    async removeProduct(productId: string, options: RemoveOptions) {
        const { force = false } = options;

        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid id");
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        // 1) SOFT DELETE – Ngừng bán
        if (!force) {
            // nếu đã ngừng bán rồi thì thôi, return luôn
            if (!product.is_active) {
                return product.toObject();
            }

            product.is_active = false;

            // tuỳ bạn: có tắt luôn các variant đang active không
            await ProductVariant.updateMany(
                { product_id: product._id, is_active: true },
                { $set: { is_active: false } }
            );

            await product.save();
            return product.toObject();
        }

        // 2) HARD DELETE – chỉ khi KHÔNG có variant & KHÔNG có order liên quan

        // 2.1. Check variant
        const variantCount = await ProductVariant.countDocuments({
            product_id: product._id,
        });

        if (variantCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn sản phẩm vẫn còn biến thể. Vui lòng xoá biến thể trước."
            );
        }

        // 2.2. Check order (chỉnh lại field cho đúng schema của bạn)
        const orderItemCount = await OrderItem.countDocuments({
            product_id: product._id, // nếu OrderItem chỉ lưu variant_id thì đổi điều kiện
        });

        if (orderItemCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn sản phẩm đã phát sinh đơn hàng."
            );
        }

        // 2.3. Xoá thumbnail trên Cloudinary (nếu có)
        if (product.thumbnail_id) {
            try {
                await cloudinaryClient.uploader.destroy(product.thumbnail_id);
            } catch (e) {
                console.error("Failed to delete product thumbnail:", e);
                // không throw để tránh kẹt xoá DB vì lỗi Cloudinary
            }
        }

        // 2.4. Xoá hẳn product
        await Product.deleteOne({ _id: product._id });

        return { deleted: true };
    },

    // ========== VARIANTS ==========

    async createVariant(productId: string, payload: CreateVariantPayload) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        const {
            sku_variant,
            frame_material,
            frame_color,
            frame_shape,
            lens_width,
            lens_height,
            temple_length,
            bridge_width,
            stock,
            has_uv_protection,
            price,
            sale_price,
            is_active,
        } = payload;

        if (
            !sku_variant ||
            !frame_material ||
            !frame_color ||
            !frame_shape ||
            !lens_width ||
            !lens_height ||
            !temple_length ||
            !bridge_width
        ) {
            throw new BadRequestException("Missing variant fields");
        }

        try {
            const variant = await ProductVariant.create({
                product_id: product._id,
                sku_variant: sku_variant.trim(),
                frame_material: frame_material.trim(),
                frame_color: frame_color.trim(),
                frame_shape: frame_shape.trim(),
                lens_width: lens_width.trim(),
                lens_height: lens_height.trim(),
                temple_length: temple_length.trim(),
                bridge_width: bridge_width.trim(),
                stock,
                has_uv_protection: !!has_uv_protection,
                price,
                sale_price: sale_price ?? null,
                is_active: typeof is_active === "boolean" ? is_active : true,
            });
            // Sau khi tạo variant:
            const variantCount = await ProductVariant.countDocuments({ product_id: productId });
            if (variantCount === 1) {
                await Product.updateOne(
                    { _id: productId },
                    { $set: { is_active: true } }
                );
            }
            return variant.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("sku_variant already exists");
            }
            throw new AppError(err.message || "Cannot create variant", 500);
        }
    },

    async updateVariant(variantId: string, payload: UpdateVariantPayload) {
        if (!Types.ObjectId.isValid(variantId)) {
            throw new BadRequestException("Invalid variant id");
        }

        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            throw new NotFoundException("Variant not found");
        }

        const {
            sku_variant,
            frame_material,
            frame_color,
            frame_shape,
            lens_width,
            lens_height,
            temple_length,
            bridge_width,
            stock,
            has_uv_protection,
            price,
            sale_price,
            is_active,
        } = payload;

        if (sku_variant !== undefined) {
            variant.sku_variant = sku_variant.trim();
        }
        if (frame_material !== undefined) {
            variant.frame_material = frame_material.trim();
        }
        if (frame_color !== undefined) {
            variant.frame_color = frame_color.trim();
        }
        if (frame_shape !== undefined) {
            variant.frame_shape = frame_shape.trim();
        }
        if (lens_width !== undefined) {
            variant.lens_width = lens_width.trim();
        }
        if (lens_height !== undefined) {
            variant.lens_height = lens_height.trim();
        }
        if (temple_length !== undefined) {
            variant.temple_length = temple_length.trim();
        }
        if (bridge_width !== undefined) {
            variant.bridge_width = bridge_width.trim();
        }
        if (stock !== undefined) {
            variant.stock = stock;
        }
        if (has_uv_protection !== undefined) {
            variant.has_uv_protection = !!has_uv_protection;
        }
        if (price !== undefined) {
            variant.price = price;
        }
        if (sale_price !== undefined) {
            variant.sale_price = sale_price ?? null;
        }
        if (typeof is_active === "boolean") {
            variant.is_active = is_active;
        }

        try {
            await variant.save();
            return variant.toObject();
        } catch (err: any) {
            if (err.code === 11000) {
                throw new BadRequestException("sku_variant already exists");
            }
            throw new AppError(err.message || "Cannot update variant", 500);
        }
    },

    async removeVariant(variantId: string, options: RemoveVariantOptions) {
        const { force = false } = options
        if (!Types.ObjectId.isValid(variantId)) {
            throw new BadRequestException("Invalid variant id");
        }

        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            throw new NotFoundException("Variant not found");
        }

        // soft delete
        // ========== SOFT DELETE ==========
        if (!force) {
            // Nếu đã tắt rồi thì thôi, trả lại luôn
            if (!variant.is_active) {
                return variant.toObject();
            }

            variant.is_active = false;
            await variant.save();

            // Nếu product của variant này không còn active variant nào
            // => tự động tắt luôn product (is_active=false)
            const activeCount = await ProductVariant.countDocuments({
                product_id: variant.product_id,
                is_active: true,
            });

            if (activeCount === 0) {
                await Product.updateOne(
                    { _id: variant.product_id },
                    { $set: { is_active: false } }
                );
            }

            return variant.toObject();
        }

        // ========== HARD DELETE ==========

        // 1) Check order item: nếu variant đã có order → không cho xoá cứng
        const orderItemCount = await OrderItem.countDocuments({
            variant_id: variant._id,
        });

        if (orderItemCount > 0) {
            throw new BadRequestException(
                "Không thể xoá vĩnh viễn biến thể đã phát sinh đơn hàng"
            );
        }

        // 2) Lấy tất cả ảnh gắn với variant để xoá Cloudinary + DB
        const images = await ProductImage.find({ variant_id: variant._id }).lean();

        for (const img of images) {
            if (img.url_id) {
                try {
                    await cloudinaryClient.uploader.destroy(img.url_id);
                } catch (e) {
                    console.error("Failed to delete variant image from Cloudinary:", e);
                    // không throw để tránh kẹt xoá DB
                }
            }
        }

        // 3) Xoá record ảnh trong DB
        await ProductImage.deleteMany({ variant_id: variant._id });

        // 4) Xoá variant khỏi DB
        await ProductVariant.deleteOne({ _id: variant._id });

        return { deleted: true };
    },

    // ========== IMAGES ==========

    /**
     * Upsert ảnh cho 1 variant theo position
     * Unique index: (product_id, position)
     * => mỗi position của 1 product chỉ có đúng 1 ảnh.
     */
    async upsertVariantImage(
        productId: string,
        variantId: string,
        payload: UpsertVariantImagePayload
    ) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product id");
        }
        if (!Types.ObjectId.isValid(variantId)) {
            throw new BadRequestException("Invalid variant id");
        }

        const [product, variant] = await Promise.all([
            Product.findById(productId).lean(),
            ProductVariant.findById(variantId).lean(),
        ]);

        if (!product) throw new NotFoundException("Product not found");
        if (!variant) throw new NotFoundException("Variant not found");
        if (String(variant.product_id) !== String(product._id)) {
            throw new BadRequestException("Variant does not belong to product");
        }

        const { url, url_id, position } = payload;

        if (position < 0) {
            throw new BadRequestException("position must be >= 0");
        }

        const doc = await ProductImage.findOneAndUpdate(
            { product_id: product._id, position },
            {
                $set: {
                    product_id: product._id,
                    variant_id: variant._id,
                    url,
                    url_id,
                    position,
                },
            },
            { new: true, upsert: true }
        );

        return doc.toObject();
    },

    /**
     * Reorder ảnh của 1 variant:
     * body: { items: [{ image_id, position }, ...] }
     * Thực ra ảnh gắn theo product_id + position, nên reorder sẽ ảnh hưởng cả gallery của product.
     */

    async reorderVariantImages(
        variantId: string,
        items: { image_id: string; position: number }[]
    ) {
        if (!Types.ObjectId.isValid(variantId)) {
            throw new BadRequestException("Invalid variant id");
        }

        const variant = await ProductVariant.findById(variantId).lean();
        if (!variant) {
            throw new NotFoundException("Variant not found");
        }

        // validate cơ bản
        for (const item of items) {
            if (!Types.ObjectId.isValid(item.image_id)) {
                throw new BadRequestException("Invalid image id");
            }
            if (item.position < 0) {
                throw new BadRequestException("position must be >= 0");
            }
        }

        const TEMP_OFFSET = 1000;

        // ===== BƯỚC 1: đẩy sang vị trí tạm (position + TEMP_OFFSET) =====
        const bulkTemp = items.map((item) => ({
            updateOne: {
                filter: {
                    _id: new Types.ObjectId(item.image_id),
                    variant_id: variant._id,
                },
                update: {
                    $set: {
                        position: item.position + TEMP_OFFSET,
                    },
                },
            },
        }));

        await ProductImage.bulkWrite(bulkTemp);

        // ===== BƯỚC 2: set về vị trí chuẩn 0..n-1 =====
        const bulkFinal = items.map((item) => ({
            updateOne: {
                filter: {
                    _id: new Types.ObjectId(item.image_id),
                    variant_id: variant._id,
                },
                update: {
                    $set: {
                        position: item.position,
                    },
                },
            },
        }));

        await ProductImage.bulkWrite(bulkFinal);

        return { success: true };
    },
    async getVariantImages(variantId: string) {
        if (!Types.ObjectId.isValid(variantId)) {
            throw new BadRequestException("Invalid variant id");
        }

        const variant = await ProductVariant.findById(variantId).lean();
        if (!variant) {
            throw new NotFoundException("Variant not found");
        }

        const images = await ProductImage.find({ variant_id: variant._id })
            .sort({ position: 1 })
            .lean();

        return images;
    },
    async deleteImage(imageId: string) {
        if (!Types.ObjectId.isValid(imageId)) {
            throw new BadRequestException("Invalid image id");
        }

        const img = await ProductImage.findById(imageId);
        if (!img) {
            throw new NotFoundException("Image not found");
        }

        // Xoá trên Cloudinary nếu có url_id
        if (img.url_id) {
            try {
                await cloudinaryClient.uploader.destroy(img.url_id);
            } catch (e) {
                console.error("Failed to delete image from Cloudinary:", e);
                // không throw để tránh kẹt xoá DB
            }
        }

        await img.deleteOne();
        return { success: true };
        return { success: true };
    },
};
