import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException, NotFoundException } from "../../../utils/app_errol";
const getSearchSuggestions = TryCatch(async (req: Request, res: Response) => {
    const q = String(req.query.q || "").trim();
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!q) {
        // có thể trả "hot keywords" sau, tạm thời trả rỗng
        return res.json({
            data: {
                keywords: [],
                products: [],
                brands: [],
            },
        });
    }

    const data = await productService.getSearchSuggestions(q, limit);
    return res.json({ data });
});
const getProducts = TryCatch(async (req: Request, res: Response) => {
    const {
        q,
        categories,
        brands,
        minPrice,
        maxPrice,
        sort,
        page,
        limit,
        gender,
        shape,
        // type: frame | sunglasses (FE tự map sang categories, BE không cần xử lý)
    } = req.query;

    const result = await productService.getPublicProducts({
        q: q as string | undefined,
        categories: categories
            ? String(categories).split(",").filter(Boolean)
            : undefined,
        brands: brands ? String(brands).split(",").filter(Boolean) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sort as any,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        gender: gender as any,
        shape: shape as string | undefined,
    });

    return res.json({
        data: result.items,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
        },
    });
});

export const getProductDetail = TryCatch(async (req, res) => {
    const { productId } = req.params;
    if (!productId) throw new BadRequestException("Missing productId");

    const data = await productService.getProductDetail(productId);
    if (!data) throw new NotFoundException("Product not found");

    return res.json({ data });
});
export const productController = {
    getProducts,
    getProductDetail,
    getSearchSuggestions
}

