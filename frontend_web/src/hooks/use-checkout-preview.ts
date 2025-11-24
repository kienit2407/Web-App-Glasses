/* eslint-disable @typescript-eslint/no-explicit-any */
// src/stores/checkout.store.ts
import { create } from "zustand";
import { API } from "@/app/lib/axios-client";
import { message } from "antd";

export type CouponInfo = {
    _id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
};

type CheckoutState = {
    // coupon
    couponInput: string;
    appliedCouponCode: string | null;
    couponInfo: CouponInfo | null;
    isCheckingCoupon: boolean;

    setCouponInput: (value: string) => void;
    applyCoupon: (subtotal: number) => Promise<void>;
    clearCoupon: () => void;
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
    couponInput: "",
    appliedCouponCode: null,
    couponInfo: null,
    isCheckingCoupon: false,

    setCouponInput: (value) => set({ couponInput: value }),

    clearCoupon: () =>
        set({
            couponInput: "",
            appliedCouponCode: null,
            couponInfo: null,
        }),

    applyCoupon: async (subtotal: number) => {
        const code = get().couponInput.trim().toUpperCase();
        if (!code) {
            message.warning("Vui lòng nhập mã giảm giá");
            return;
        }

        set({ isCheckingCoupon: true });
        try {
            const res = await API.get(
                `/coupons/${encodeURIComponent(code)}/check`,
                { params: { subtotal } }           
            );

            const info: CouponInfo = res.data?.data;

            set({
                appliedCouponCode: info.code,
                couponInfo: info,
            });

            message.success("Áp dụng mã giảm giá thành công");
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.msg ||        // ✅ phòng trường hợp BE dùng 'msg'
                "Mã giảm giá không hợp lệ hoặc không áp dụng cho đơn này";

            set({
                appliedCouponCode: null,
                couponInfo: null,
            });

            message.error(msg);
        } finally {
            set({ isCheckingCoupon: false });
        }
    },
}));
