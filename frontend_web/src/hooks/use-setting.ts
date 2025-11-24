// src/stores/use-shop-settings.ts
import { create } from "zustand";

export interface ShippingOrigin {
    province_code: string;
    district_code: string;
    ward_code: string;
    address_line: string;
}

export interface ShopSettings {
    shop_name?: string | null;
    shop_email?: string | null;
    shop_phone?: string | null;
    shop_logo_url?: string | null;
    shipping_origin?: ShippingOrigin | null;

    province_name?: string | null;
    district_name?: string | null;
    ward_name?: string | null;
}

interface ShopSettingsState {
    settings: ShopSettings | null;
    setSettings: (s: ShopSettings | null) => void;
}

export const useShopSettingsStore = create<ShopSettingsState>((set) => ({
    settings: null,
    setSettings: (s) => set({ settings: s }),
}));
