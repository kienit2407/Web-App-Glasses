// src/hooks/use-coupons.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { API } from "@/app/lib/axios-client";
import { message } from "antd";

// Thông tin cơ bản của 1 coupon
export type CouponType = "percent" | "fixed";

export interface CouponSummary {
    _id: string;
    code: string;
    type: CouponType;
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    start_date?: string | null;
    end_date?: string | null;
}

// Coupon đã gắn với user (dùng cho Kho voucher + Checkout)
export interface UserCouponItem extends CouponSummary {
    // server có thể trả thêm
    can_use: boolean;
    is_expired: boolean;
    missing_amount?: number; // khi tính kèm subtotal ở checkout
    is_used?: boolean;       // nếu đơn đã dùng coupon này rồi
}

// Coupon hiển thị ở “trung tâm voucher” (vouchers hệ thống đang chạy)
export interface AvailableCoupon extends CouponSummary {
    is_saved?: boolean; // BE có thể trả, nếu không có ta tự suy từ myCoupons
}

interface CouponStoreState {
    // Kho voucher của tôi
    myCoupons: UserCouponItem[];
    myCouponsLoading: boolean;

    // Danh sách voucher hệ thống (trang Trung tâm voucher)
    availableCoupons: AvailableCoupon[];
    availableCouponsLoading: boolean;

    // actions
    fetchMyCoupons: (opts?: { subtotal?: number }) => Promise<void>;
    fetchAvailableCoupons: () => Promise<void>;
    claimCoupon: (code: string) => Promise<void>;
}

export const useCouponStore = create<CouponStoreState>((set, get) => ({
    myCoupons: [],
    myCouponsLoading: false,

    availableCoupons: [],
    availableCouponsLoading: false,

    // GET /users/me/coupons?subtotal=xxx (subtotal optional)
    fetchMyCoupons: async (opts) => {
        const subtotal = opts?.subtotal;
        set({ myCouponsLoading: true });
        try {
            const res = await API.get("/users/me/coupons", {
                params: subtotal != null ? { subtotal } : undefined,
            });

            // BE nên trả { data: { items: [...] } }
            const items: UserCouponItem[] = res.data?.data?.items || [];
            set({ myCoupons: items });
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ??
                err?.response?.data?.msg ??
                "Không tải được kho voucher";
            message.error(msg);
        } finally {
            set({ myCouponsLoading: false });
        }
    },

    // GET /coupons  (bạn implement ở COUPON_ROUTES)
    fetchAvailableCoupons: async () => {
        set({ availableCouponsLoading: true });
        try {
            const res = await API.get("/coupons");
            // BE nên trả { data: { items: [...] } }
            const items: AvailableCoupon[] = res.data?.data?.items || [];
            set({ availableCoupons: items });
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ??
                err?.response?.data?.msg ??
                "Không tải được danh sách voucher hệ thống";
            message.error(msg);
        } finally {
            set({ availableCouponsLoading: false });
        }
    },

    // POST /coupons/claim/:code
    claimCoupon: async (code: string) => {
        try {
            await API.post(`/coupons/claim/${code}`);
            message.success("Đã lưu voucher vào kho của bạn");

            // refresh lại cả 2 list để đồng bộ trạng thái
            const { fetchMyCoupons, fetchAvailableCoupons } = get();
            // không cần subtotal ở đây
            fetchMyCoupons();
            fetchAvailableCoupons();
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ??
                err?.response?.data?.msg ??
                "Không lưu được voucher";
            message.error(msg);
        }
    },
}));
