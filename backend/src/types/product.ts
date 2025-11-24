export interface ProductListItem {
    product_id: string,
    product_name: string
    slug: string,
    thumbnail_url: string,
    selled_amount: string
    review_count: string
    min_price: string
    max_price: string
    category_id: string
    brand_id: string
    createdAt: string
};

export type ProductSortOption =
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating"
    | "most_sold";

export interface GetProductsQuery {
    q?: string;
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: ProductSortOption;
    page?: number;
    limit?: number;

    // dùng cho filter từ Navbar & trang Products
    gender?: "male" | "female" | "unisex" | "kids";
    shape?: string; // frame_shape của variant
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
