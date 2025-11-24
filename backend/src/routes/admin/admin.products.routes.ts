import express, { Router } from "express"
import { uploadMiddlewares } from "../../middleware/upload.middlewares"
import { adminProductController } from "../../modules/admin/controllers/admin.product.controller"
import { authMidleWares } from "../../middleware/authMiddleware"

const router: Router = express.Router()
router.use(
    authMidleWares.protectUserRoute,
    authMidleWares.protectAdminRoute
)
// GET /admin/products
// → Lấy danh sách products (có filter q, status=active|inactive|draft, phân trang)
router.get("/",
    /*validate(create),*/ /*adminProduct.list*/
    adminProductController.list
)
// POST /admin/products
// → Tạo mới 1 product (multipart/form-data, field "thumbnail")
//   - uploadMiddlewares.upload.single("thumbnail"): nhận 1 file thumbnail
router.post("/",
    /*validate(create),*/
    /*adminProduct.create*/
    uploadMiddlewares.upload.single("thumbnail"),
    adminProductController.create
)

// GET /admin/products/:id
// → Lấy chi tiết 1 product + đếm số variant (variant_count)
router.get(
    "/:id",
    adminProductController.detail // <-- THÊM ROUTE CHI TIẾT
);

// PATCH /admin/products/:id
// → Cập nhật product (thông tin, thumbnail, is_active…)
//   - Có thể gửi kèm file "thumbnail" để đổi ảnh
router.patch(
    "/:id",
    /*validate(update),*/ /*adminProduct.update*/
    uploadMiddlewares.upload.single("thumbnail"),
    adminProductController.update
)
// DELETE /admin/products/:id
// → Xoá product
//   - Nếu không có ?force → xoá mềm: set is_active=false (+ optionally tắt variants)
//   - Nếu có ?force=true → cố gắng xoá cứng, có check variant & orderItem
router.delete(
    "/:id", /*adminProduct.remove*/
    adminProductController.remove
)

//===============VARIANT======================
// GET /admin/products/:id/variants
// → Lấy danh sách variants của 1 product (theo product_id)
router.get( // lấy variant
    "/:id/variants",
    adminProductController.listVariants // <-- TUỲ CHỌN
);
// GET /admin/products/variants/:variantId
// → Lấy chi tiết 1 variant theo variantId
router.get( //lấy chi tiết
    "/variants/:variantId",
    adminProductController.variantDetail
);
// POST /admin/products/:id/variants
// → Tạo 1 variant mới cho product :id
//   - Body là thông tin variant (sku, price, size,...)
//   - Ảnh sẽ upload ở route riêng bên dưới
router.post(
    "/:id/variants", /*validate(createVariant),*/ /*adminProduct.createVariant*/
    adminProductController.createVariant
)
// PATCH /admin/products/variants/:variantId
// → Cập nhật thông tin 1 variant
router.patch(
    "/variants/:variantId",
    /*validate(updateVariant),*/ /*adminProduct.updateVariant*/
    adminProductController.updateVariant
)
// DELETE /admin/products/variants/:variantId
// → Xoá 1 variant
//   - Hiện tại service đang làm: xoá mềm (set is_active=false)
//   - Sau này có thể nâng cấp thành: force soft/hard tương tự product
router.delete(
    "/variants/:variantId", /*adminProduct.removeVariant*/
    adminProductController.removeVariant
)
// ================== VARIANT IMAGES ==================

router.get(
    "/variants/:variantId/images",
    adminProductController.listVariantImages
);

// POST /admin/products/:id/variants/:variantId/images
// → Upload nhiều ảnh cho 1 variant (tối đa 5 file "images")
//   - uploadMiddlewares.upload.array("images", 5)
//   - Controller upload lên Cloudinary, sau đó ghi vào ProductImage
//   - Position tự tăng (gallery product/variant)

router.post(
    "/:id/variants/:variantId/images",
    /*validate(upsertImage),*/ /*adminProduct.upsertVariantImage*/
    uploadMiddlewares.upload.array("images", 5),
    adminProductController.upsertVariantImage
)
// PATCH /admin/products/variants/:variantId/images/reorder
// → Đổi thứ tự ảnh của 1 variant (reorder position)
//   - Body: { items: [{ image_id, position }, ...] }
router.patch(
    "/variants/:variantId/images/reorder",
    adminProductController.reorderVariantImages
    /*validate(reorder),*/ /*adminProduct.reorderVariantImages*/
)
// DELETE /admin/products/images/:imageId
// → Xoá 1 ảnh product/variant theo imageId (ProductImage)
//   - Service hiện tại chỉ xoá record, có thể thêm xoá Cloudinary sau
router.delete(
    "/images/:imageId", /*adminProduct.deleteImage*/
    adminProductController.deleteImage
)


export const ADMIN_PRODUCTS_ROUTES = router
