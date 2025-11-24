/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { toast } from "sonner";
import { API } from "@/app/lib/axios-client";
import { ProductListItem } from "@/types/product";

export interface CategoryNode {
    _id: string;
    category_id: string;
    category_name: string;
    slug: string; // nhớ đảm bảo API /catalog/categories trả slug
    parent_id?: string | null;
    children?: CategoryNode[];
}
type ProductType = "frame" | "sunglasses"

export interface BrandItem {
    _id: string;
    brand_name: string;
    slug: string;
    logo_url?: string | null;
}
interface CatalogParams {
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
    type?: ProductType;
}

interface ProductState {
    isLoading: boolean;
    page: number;
    limit: number;
    total: number;
    featuredProducts: Array<ProductListItem>;
    bestSellerProducts: Array<ProductListItem>;
    listCategories: Array<CategoryNode>;
    listProduct: Array<ProductListItem>;
    listBrands: Array<BrandItem>;

    getListQuery: (params?: CatalogParams) => Promise<void>;
    fetchCategories: () => Promise<CategoryNode[]>;
    fetchHomeProducts: () => Promise<void>;
    fetchBrands: () => Promise<BrandItem[]>
}

export const useCatalog = create<ProductState>()((set, get) => ({
    isLoading: false,
    page: 1,
    limit: 12,
    total: 0,
    featuredProducts: [],
    bestSellerProducts: [],
    listProduct: [],
    listCategories: [],
    listBrands: [],
    // ====== LIST PRODUCTS (trang /products + home) ======
    getListQuery: async (params) => {
        const { page, limit } = get();
        set({ isLoading: true });

        try {
            const res = await API.get("/catalog/products", {
                params: {
                    q: params?.q,
                    categories: params?.categories?.join(","),
                    brands: params?.brands?.join(","),
                    minPrice: params?.minPrice,
                    maxPrice: params?.maxPrice,
                    sort: params?.sort,
                    page: params?.page ?? page,
                    limit: params?.limit ?? limit,
                    gender: params?.gender,
                    shape: params?.shape,
                    type: params?.type,
                },
            });

            // BE: { data: ProductListItem[], pagination: { total, page, limit } }
            const items: ProductListItem[] = res.data?.data ?? [];
            const pagination = res.data?.pagination ?? {};

            set({
                listProduct: items,
                page: pagination.page ?? page,
                limit: pagination.limit ?? limit,
                total: pagination.total ?? 0,
            });
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.msg ?? "Lỗi trong khi tải danh sách sản phẩm"
            );
        } finally {
            set({ isLoading: false });
        }
    },

    // ====== CATEGORIES ======
    fetchCategories: async () => {
        try {
            const res = await API.get("/catalog/categories", {
                params: { active: 1 },
            });
            const data: CategoryNode[] = res.data?.data ?? [];
            set({ listCategories: data });
            return data; // để Products.tsx dùng map type->slug
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Lỗi khi tải danh mục");
            return [];
        }
    },

    // ====== HOME SECTIONS (newest + most_sold) ======
    fetchHomeProducts: async () => {
        set({ isLoading: true });
        try {
            const [featuredRes, bestSellerRes] = await Promise.all([
                API.get("/catalog/products", {
                    params: {
                        sort: "newest",
                        page: 1,
                        limit: 8,
                    },
                }),
                API.get("/catalog/products", {
                    params: {
                        sort: "most_sold",
                        page: 1,
                        limit: 8,
                    },
                }),
            ]);

            const featuredItems: ProductListItem[] = featuredRes.data?.data ?? [];
            const bestSellerItems: ProductListItem[] = bestSellerRes.data?.data ?? [];

            set({
                featuredProducts: featuredItems,
                bestSellerProducts: bestSellerItems,
            });
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.msg ?? "Lỗi khi tải sản phẩm trang chủ"
            );
        } finally {
            set({ isLoading: false });
        }
    },
    fetchBrands: async () => {
        try {
            const res = await API.get("/catalog/brands", {
                params: { active: 1 }, // giống categories
            });

            const brands: BrandItem[] = res.data?.data ?? [];
            set({ listBrands: brands });
            return brands;
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Lỗi khi tải thương hiệu");
            return [];
        }
    },
}));
