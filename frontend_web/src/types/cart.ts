// src/types/cart.ts
export interface CartItem {
    item_id: string;
    cart_id: string;
    variant_id: string;
    product_id: string;
    product_name: string;
    thumbnail_url: string | null;
    frame_color?: string;
    frame_shape?: string;

    original_unit_price: number; // variant.price
    unit_price: number;          // price_at_add
    has_discount: boolean;
    discount_percent: number;
    quantity: number;

    original_subtotal: number;
    subtotal: number;
    discount_amount: number;
}

export interface CartResponse {
    cart_id: string;
    items: CartItem[];
    total_quantity: number;
    total_original_amount: number;
    total_amount: number;
    total_discount_amount: number;
}
