// src/controllers/admin_product.controller.ts
import { Request, Response } from "express"
import { TryCatch } from "../../../utils/try_catch"
import { BadRequestException, NotFoundException } from "../../../utils/app_errol"
import { adminProductService } from "../services/admin.product.service"
import { uploadImageBuffer } from "../../../utils/cloudinary.helper"
import { cloudinaryClient } from "../../../config/cloudinary"
import { Types } from "mongoose"
import { ProductVariant } from "../../../models/product.variants.model"
import { Product } from "../../../models/products.model"
import { ProductImage } from "../../../models/products.image.model"
// type mở rộng nếu muốn typed req.file (optional)
interface MulterRequest extends Request {
    file?: Express.Multer.File
}
export const list = TryCatch(async (req: Request, res: Response) => {
    const { q, status, page = "1", limit = "10" } = req.query

    // ép kiểu & validate nhẹ
    const pageNum = Number(page) || 1
    const limitNum = Number(limit) || 10

    let statusFilter: "active" | "inactive" | "draft" | undefined

    if (status === "active" || status === "inactive" || status === "draft") {
        statusFilter = status
    }

    const data = await adminProductService.listProducts({
        q: q ? String(q) : undefined,
        status: statusFilter,
        page: pageNum,
        limit: limitNum,
    })

    return res.json({ data })
})
export const detail = TryCatch(async (req, res) => {
    const { id } = req.params
    if (!id) throw new BadRequestException("id is required")
    const product = await Product.findById(id).lean()
    if (!product) throw new NotFoundException("Product not found")

    const variantCount = await ProductVariant.countDocuments({ product_id: id })
    const data = await adminProductService.getProductDetail(id)
    return res.json({
        data: {
            product,
            variant_count: variantCount,
        },
    })
})
export const variantDetail = TryCatch(async (req, res) => {
    const { variantId } = req.params
    if (!Types.ObjectId.isValid(variantId)) {
        throw new BadRequestException("Invalid variantId")
    }

    const variant = await ProductVariant.findById(variantId).lean()
    if (!variant) throw new NotFoundException("Variant not found")

    return res.json({ data: variant })
})
const create = TryCatch(async (req: MulterRequest, res: Response) => {
    const {
        product_name,
        description,
        origin_country,
        category_id,
        brand_id,
        for_gender,
        is_active,
    } = req.body

    if (!product_name || !description || !category_id || !brand_id) {
        throw new BadRequestException("product_name, description, category_id, brand_id are required")
    }

    // tags gửi lên dạng JSON string (từ FormData)
    let tags: string[] | undefined
    if (req.body.tags) {
        try {
            tags = JSON.parse(req.body.tags)
        } catch (e) {
            throw new BadRequestException("tags is not valid JSON")
        }
    }

    // file thumbnail bắt buộc
    if (!req.file) {
        throw new BadRequestException("thumbnail file is required")
    }

    const { secure_url, public_id } = await uploadImageBuffer(
        req.file!.buffer,
        "products/thumbnails"
    )

    const product = await adminProductService.createProduct({
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
    })

    return res.status(201).json({ data: product })
})


// PATCH /admin/products/:id
export const update = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) throw new BadRequestException("id is required")

    const {
        product_name,
        slug,
        description,
        origin_country,
        category_id,
        for_gender,
        brand_id,
        is_active,
    } = req.body

    // tags gửi lên dạng JSON string (từ FormData)
    let tags: string[] | undefined
    if (req.body.tags) {
        try {
            tags = JSON.parse(req.body.tags)
        } catch (e) {
            throw new BadRequestException("tags is not valid JSON")
        }
    }

    // 2) Xử lý thumbnail mới (nếu có)
    let thumbnail_url: string | undefined
    let thumbnail_id: string | undefined

    if (req.file) {
        // vì dùng upload.single("thumbnail") nên CHẮC CHẮN chỉ có 1 file
        const { secure_url, public_id } = await uploadImageBuffer(
            req.file.buffer,
            "products/thumbnails"
        )

        thumbnail_url = secure_url
        thumbnail_id = public_id
    }

    // / Convert is_active từ string -> boolean
    let parsedIsActive: boolean | undefined
    if (typeof is_active === "string") {
        if (is_active === "true") parsedIsActive = true
        else if (is_active === "false") parsedIsActive = false
        else parsedIsActive = undefined // giá trị rác thì bỏ qua
    } else if (typeof is_active === "boolean") {
        parsedIsActive = is_active
    }

    const product = await adminProductService.updateProduct(id, {
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
    })

    return res.json({ data: product })
})

// DELETE /admin/products/:id
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params
    const force =
        req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes"

    if (!id) throw new BadRequestException("id is required")

    const result = await adminProductService.removeProduct(id, { force })
    return res.json({ data: result })
})

// ===== VARIANTS =====

// POST /admin/products/:id/variants
export const createVariant = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) throw new BadRequestException("product id is required")

    const variant = await adminProductService.createVariant(id, req.body)

    return res.status(201).json({ data: variant })
})

// PATCH /admin/products/variants/:variantId
export const updateVariant = TryCatch(async (req: Request, res: Response) => {
    const { variantId } = req.params
    if (!variantId) throw new BadRequestException("variantId is required")

    const variant = await adminProductService.updateVariant(variantId, req.body)
    return res.json({ data: variant })
})

// DELETE /admin/products/variants/:variantId
export const removeVariant = TryCatch(async (req: Request, res: Response) => {
    const { variantId } = req.params
    const force =
        req.query.force === "true" ||
        req.query.force === "1" ||
        req.query.force === "yes"
    if (!variantId) throw new BadRequestException("variantId is required")

    const result = await adminProductService.removeVariant(variantId, { force })
    return res.json({ data: result })
})

// ===== IMAGES =====

// POST /admin/products/:id/variants/:variantId/images
export const upsertVariantImage = TryCatch(async (req: Request, res: Response) => {
    const { id, variantId } = req.params
    if (!id || !Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid product id")
    if (!variantId || !Types.ObjectId.isValid(variantId)) throw new BadRequestException("Invalid variant id")

    const files = (req.files as Express.Multer.File[]) || []
    if (!files.length) {
        throw new BadRequestException("No images uploaded")
    }

    // 1) Tính position bắt đầu (lấy max position hiện có của product)
    const startPos = await adminProductService.getNextImagePositionForProduct(id)

    // 2) Upload tất cả file lên Cloudinary (song song)
    const uploads = await Promise.all(
        files.map(
            (file, idx) =>
                new Promise<{ secure_url: string ; public_id: string; position: number }>((resolve, reject) => {
                    const stream = cloudinaryClient.uploader.upload_stream(
                        {
                            folder: `products/variants/${variantId}`,
                            resource_type: "image",
                        },
                        (error, result) => {
                            if (error || !result) return reject(error)
                            resolve({
                                secure_url: result.secure_url,
                                public_id: result.public_id,
                                position: startPos + idx, // gán thứ tự liên tục
                            })
                        }
                    )
                    stream.end(file.buffer)
                })
        )
    )

    // 3) Lưu DB (bulk) -> bảng ProductImage
    const saved = await adminProductService.addVariantImages(id, variantId, uploads)

    return res.status(201).json({ data: saved })
})

// PATCH /admin/products/variants/:variantId/images/reorder
export const reorderVariantImages = TryCatch(async (req: Request, res: Response) => {
    const { variantId } = req.params
    console.log("🔁 Reorder images variantId =", variantId)
    console.log("🔁 Body =", JSON.stringify(req.body, null, 2))
    if (!variantId) throw new BadRequestException("variantId is required")

    const { items } = req.body
    if (!Array.isArray(items)) {
        throw new BadRequestException("items must be an array")
    }

    const result = await adminProductService.reorderVariantImages(variantId, items)
    return res.json({ data: result })
})

// DELETE /admin/products/images/:imageId
export const deleteImage = TryCatch(async (req: Request, res: Response) => {
    const { imageId } = req.params
    if (!imageId) throw new BadRequestException("imageId is required")

    const result = await adminProductService.deleteImage(imageId)
    return res.json({ data: result })
})
export const listVariants = TryCatch(async (req, res) => {
    const { id } = req.params
    if (!id) throw new BadRequestException("product id is required")

    const variants = await adminProductService.getVariantsByProduct(id)
    return res.json({ data: { items: variants } })
})
export const listVariantImages = TryCatch(async (req: Request, res: Response) => {
    const { variantId } = req.params
    if (!variantId) throw new BadRequestException("variantId is required")

    const items = await adminProductService.getVariantImages(variantId)
    return res.json({ data: { items } })
})
export const adminProductController = {
    create,
    update,
    remove,
    createVariant,
    listVariants,
    list,
    updateVariant,
    removeVariant,
    listVariantImages,
    upsertVariantImage,
    reorderVariantImages,
    deleteImage,
    detail,
    variantDetail
}