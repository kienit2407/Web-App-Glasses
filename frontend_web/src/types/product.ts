export interface ProductListItem {
    product_id: string;
    product_name: string;
    slug: string;

    thumbnail_url: string | null;

    selled_amount: number;
    review_count: number;
    rating_avg: number;

    // giá thấp nhất sau giảm (từ BE đã tính)
    price: number;

    // tổng tồn kho (dùng để hiển thị “chỉ còn n sản phẩm”)
    total_stock: number;

    // % giảm cao nhất trong các variant, 0 nếu không giảm
    discount_percent: number;

    brand_id: string;
    brand_name: string | null;
    brand_logo_url: string | null;

    category_id: string;
    createdAt: string;
}

export type ProductSortOption =
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating"
    | "most_sold";

// query dùng cho catalog
export interface GetProductsQuery {
    q?: string;
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
    gender?: string;
    shape?: string;
}

// type ProductDetailResponse = {
//   product: {
//     product_id: string;
//     product_name: string;
//     slug: string;
//     description: string;
//     selled_amount: number;
//     review_count: number;
//     origin_country: string;
//     category_id: string;
//     brand_id: string;
//     tags: string[];
//     createdAt: string;
//     updatedAt: string;
//   };

//   variants: Array<{
//     variant_id: string;
//     sku_variant: string;
//     frame_material: string;
//     frame_color: string;
//     frame_shape: string;
//     lens_width: string;
//     lens_height: string;
//     temple_length: string;
//     bridge_width: string;
//     stock: number;
//     has_uv_protection: boolean;
//     price: number;
//     original_price: number | null;
//     is_active: boolean;
//   }>;

//   images: {
//     product: Array<{
//       image_id: string;
//       url: string;
//       position: number;
//     }>;
//     byVariant: Record<
//       string, // variant_id
//       Array<{
//         image_id: string;
//         url: string;
//         position: number;
//       }>
//     >;
//   };
// };
