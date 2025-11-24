/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/use-cart.ts
import { create } from "zustand";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";
import { CartResponse } from "@/types/cart";
import { message } from "antd";
import { useAuth } from "./use-auth";

interface CartState {
    cart: CartResponse | null;
    isLoading: boolean;
    isUpdating: boolean;
    selectedItemIds: string[];

    fetchCart: () => Promise<void>;
    addToCart: (variantId: string, quantity?: number) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;

    toggleSelectItem: (itemId: string) => void;
    toggleSelectAll: () => void;
    clearSelection: () => void;
}

export const useCart = create<CartState>((set, get) => ({
    cart: null,
    isLoading: false,
    isUpdating: false,
    selectedItemIds: [],

    async fetchCart() {
        try {
            const { user } = useAuth.getState();
            if (!user) {
                // chưa login -> không gọi API, giữ cart = null
                set({ cart: null, selectedItemIds: [] });
                return;
            }
            set({ isLoading: true });
            const res = await API.get<{ data: CartResponse }>("/cart");
            set({ cart: res.data.data });

            // nếu hiện tại chưa chọn gì, có thể auto chọn tất
            if (get().selectedItemIds.length === 0) {
                set({
                    selectedItemIds: res.data.data.items.map((i) => i.item_id),
                });
            }
        } catch (err) {
            console.error(err);
            // toast.error("Không tải được giỏ hàng");
        } finally {
            set({ isLoading: false });
        }
    },

    async addToCart(variantId, quantity = 1) {
        try {
            set({ isUpdating: true });
            const res = await API.post<{ data: CartResponse }>("/cart/add-item", {
                variant_id: variantId,
                quantity,
            });

            const newCart = res.data.data;
            set({ cart: newCart });

            const lastItem = newCart.items[newCart.items.length - 1];

            if (lastItem) {
                const ids = new Set(get().selectedItemIds);
                ids.add(lastItem.item_id);
                set({ selectedItemIds: Array.from(ids) });
            }

            message.success("Đã thêm vào giỏ hàng");
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Không thêm được sản phẩm vào giỏ"
            );
            throw err;
        } finally {
            set({ isUpdating: false });
        }
    },


    async updateItemQuantity(itemId, quantity) {
        try {
            set({ isUpdating: true });
            const res = await API.patch<{ data: CartResponse }>(
                `/cart/update/${itemId}`,
                { quantity }
            );
            set({ cart: res.data.data });
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.message || "Không cập nhật được số lượng"
            );
        } finally {
            set({ isUpdating: false });
        }
    },

    async removeItem(itemId) {
        try {
            set({ isUpdating: true });
            const res = await API.delete<{ data: CartResponse }>(
                `/cart/remove/${itemId}`
            );
            const { selectedItemIds } = get();
            set({
                cart: res.data.data,
                selectedItemIds: selectedItemIds.filter((id) => id !== itemId),
            });
        } catch (err: any) {
            console.error(err);
            toast.error("Không xóa được sản phẩm khỏi giỏ");
        } finally {
            set({ isUpdating: false });
        }
    },

    toggleSelectItem(itemId) {
        const { selectedItemIds } = get();
        if (selectedItemIds.includes(itemId)) {
            set({
                selectedItemIds: selectedItemIds.filter((id) => id !== itemId),
            });
        } else {
            set({ selectedItemIds: [...selectedItemIds, itemId] });
        }
    },

    toggleSelectAll() {
        const { cart, selectedItemIds } = get();
        if (!cart) return;
        const allIds = cart.items.map((i) => i.item_id);
        if (selectedItemIds.length === allIds.length) {
            // bỏ chọn tất cả
            set({ selectedItemIds: [] });
        } else {
            set({ selectedItemIds: allIds });
        }
    },

    clearSelection() {
        set({ selectedItemIds: [] });
    },
}));
