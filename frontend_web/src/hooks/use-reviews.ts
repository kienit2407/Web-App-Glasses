/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";

export interface ReviewMedia {
    url: string;
    url_id?: string;
}

export interface ReviewItem {
    id: string;
    product_id: string;
    rating: number;
    comment: string;
    images: ReviewMedia[];
    video_url?: string | null;
    is_edited: boolean;
    createdAt: string;

    admin_reply?: null | {
        content: string;
        is_edited?: boolean;
        createdAt?: string;
        updatedAt?: string;
        admin_id?: { _id: string; display_name: string };
    };

    user_id: {
        id: string;
        display_name: string;
        avatar_url?: string;
    };
}

interface ReviewState {
    items: ReviewItem[];
    page: number;
    limit: number;
    total: number;
    avg_rating: number;
    isLoading: boolean;

    fetchOfProduct: (productId: string, page?: number) => Promise<void>;
    create: (formData: FormData) => Promise<void>;
    update: (id: string, formData: FormData) => Promise<void>;
    remove: (id: string) => Promise<void>;
}

export const useReviews = create<ReviewState>()((set, get) => ({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    avg_rating: 0,
    isLoading: false,

    async fetchOfProduct(productId, page = 1) {
        set({ isLoading: true });
        try {
            const res = await API.get(`/reviews/of/${productId}`, {
                params: { page, limit: get().limit },
            });

            const raw = res.data?.data ?? [];
            const meta = res.data?.meta ?? {};

            const mapped: ReviewItem[] = raw.map((item: any) => ({
                id: String(item._id),
                product_id: String(item.product_id),
                rating: item.rating,
                comment: item.comment,
                images: (item.images ?? []).map((img: any) => ({ url: img.url, url_id: img.url_id })),
                video_url: item.video_url,
                is_edited: item.is_edited,
                createdAt: item.createdAt,
                admin_reply: item.admin_reply
                    ? {
                        content: item.admin_reply.content,
                        is_edited: item.admin_reply.is_edited,
                        createdAt: item.admin_reply.createdAt,
                        updatedAt: item.admin_reply.updatedAt,
                        admin_id: item.admin_reply.admin_id
                            ? { _id: String(item.admin_reply.admin_id._id), display_name: item.admin_reply.admin_id.display_name }
                            : undefined,
                    }
                    : null,
                user_id: {
                    id: String(item.user_id?._id),
                    display_name: item.user_id?.display_name,
                    avatar_url: item.user_id?.avatar_url,
                },
            }));


            set({
                items: mapped,
                page: meta.page ?? page,
                limit: meta.limit ?? get().limit,
                total: meta.total ?? 0,
                avg_rating: Number(meta.avg_rating ?? 0), // ✅ luôn là number
            });
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Không tải được đánh giá");
        } finally {
            set({ isLoading: false });
        }
    },

    async create(formData) {
        try {
            await API.post("/reviews", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Đã gửi đánh giá");
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Không gửi được đánh giá");
            throw err;
        }
    },

    async update(id, formData) {
        try {
            await API.patch(`/reviews/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Đã cập nhật đánh giá");
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Không cập nhật được đánh giá");
            throw err;
        }
    },

    async remove(id) {
        try {
            await API.delete(`/reviews/${id}`);
            toast.success("Đã xoá đánh giá");
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Không xoá được đánh giá");
            throw err;
        }
    },
}));
