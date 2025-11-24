/* eslint-disable @typescript-eslint/no-explicit-any */
import { Drawer, List, Button, Select, Space, message, Tag } from "antd";
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";

interface Props {
    open: boolean;
    promotionId: string | null;
    onClose: () => void;
}

interface CouponOption {
    label: string;
    value: string;
}

interface BrandOption {
    label: string;
    value: string;
}

interface ProductOption {
    label: string;
    value: string;
}

const PromotionRelationsDrawer = ({ open, promotionId, onClose }: Props) => {
    const [loading, setLoading] = useState(false);
    const [relations, setRelations] = useState<any | null>(null);

    const [couponOptions, setCouponOptions] = useState<CouponOption[]>([]);
    const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

    const [selectedCoupon, setSelectedCoupon] = useState<string | undefined>();
    const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
    const [selectedProduct, setSelectedProduct] = useState<string | undefined>();

    const fetchRelationsAndOptions = async () => {
        if (!promotionId) return;
        setLoading(true);
        try {
            // 1) Quan hệ hiện tại
            const res = await API.get(`/admin/promotions/${promotionId}/relations`);
            setRelations(res.data.data);

            // 2) Load danh sách coupon/brand/product cho Select
            const [couponsRes, brandsRes, productsRes] = await Promise.all([
                API.get("/admin/coupons", { params: { limit: 100 } }),
                API.get("/admin/brands", { params: { limit: 100 } }),
                API.get("/admin/products", { params: { limit: 100 } }),
            ]);

            // ⚠ Tuỳ API thật của bạn, có thể là `data.data.items` hoặc `data.data`
            const couponItems =
                couponsRes.data?.data?.items ?? couponsRes.data?.data ?? [];
            const brandItems =
                brandsRes.data?.data?.items ?? brandsRes.data?.data ?? [];
            const productItems =
                productsRes.data?.data?.items ?? productsRes.data?.data ?? [];

            setCouponOptions(
                couponItems.map((c: any) => ({
                    label: `${c.code} - ${c.name ?? ""}`,
                    value: String(c._id),
                }))
            );

            setBrandOptions(
                brandItems.map((b: any) => ({
                    
                    label: b.brand_name,
                    value: String(b.id),
                }))
            );

            setProductOptions(
                productItems.map((p: any) => ({
                    label: p.product_name,
                    value: String(p.id ?? p._id),
                }))
            );
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.msg || "Không tải được quan hệ khuyến mãi"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && promotionId) {
            // reset lựa chọn mỗi lần mở
            setSelectedCoupon(undefined);
            setSelectedBrand(undefined);
            setSelectedProduct(undefined);
            fetchRelationsAndOptions();
        }
    }, [open, promotionId]);

    const handleLink = async (type: "coupon" | "brand" | "product") => {
        if (!promotionId) {
            message.error("Thiếu promotionId");
            return;
        }

        let targetId: string | undefined;

        if (type === "coupon") {
            targetId = selectedCoupon;
            if (!targetId) {
                message.error("Vui lòng chọn coupon");
                return;
            }
        } else if (type === "brand") {
            targetId = selectedBrand;
            if (!targetId) {
                message.error("Vui lòng chọn thương hiệu");
                return;
            }
        } else {
            targetId = selectedProduct;
            if (!targetId) {
                message.error("Vui lòng chọn sản phẩm");
                return;
            }
        }

        const url =
            type === "coupon"
                ? `/admin/promotions/${promotionId}/coupons/${targetId}`
                : type === "brand"
                    ? `/admin/promotions/${promotionId}/brands/${targetId}`
                    : `/admin/promotions/${promotionId}/products/${targetId}`;

        try {
            await API.post(url);
            message.success("Đã liên kết");
            fetchRelationsAndOptions();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.msg || "Không thể liên kết");
        }
    };

    const handleUnlink = async (
        type: "coupon" | "brand" | "product",
        targetId: string
    ) => {
        if (!promotionId) {
            message.error("Thiếu promotionId");
            return;
        }
        let url = "";
        if (type === "coupon") {
            url = `/admin/promotions/${promotionId}/coupons/${targetId}`;
        } else if (type === "brand") {
            url = `/admin/promotions/${promotionId}/brands/${targetId}`;
        } else {
            url = `/admin/promotions/${promotionId}/products/${targetId}`;
        }

        try {
            await API.delete(url);
            message.success("Đã bỏ liên kết");
            fetchRelationsAndOptions();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.msg || "Không thể bỏ liên kết");
        }
    };

    return (
        <Drawer
            open={open}
            title="Quản lý áp dụng khuyến mãi"
            onClose={onClose}
            width={720}
        >
            {/* Coupons */}
            <h3>Coupon áp dụng</h3>
            <Space style={{ marginBottom: 8 }}>
                <Select
                    style={{ width: 260 }}
                    options={couponOptions}
                    value={selectedCoupon}
                    onChange={(value) => setSelectedCoupon(value)}
                    placeholder="Chọn coupon"
                    allowClear
                />
                <Button type="primary" onClick={() => handleLink("coupon")}>
                    Thêm coupon
                </Button>
            </Space>
            <List
                loading={loading}
                dataSource={relations?.coupons ?? []}
                renderItem={(c: any) => (
                    <List.Item
                        actions={[
                            <Button
                                key="unlink"
                                danger
                                type="link"
                                onClick={() => handleUnlink("coupon", c._id)}
                            >
                                Bỏ liên kết
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <>
                                    <Tag color="blue">{c.code}</Tag> {c.name}
                                </>
                            }
                            description={
                                c.type && c.value
                                    ? `Giảm: ${c.type === "percent"
                                        ? c.value + "%"
                                        : c.value.toLocaleString("vi-VN") + "₫"
                                    }`
                                    : undefined
                            }
                        />
                    </List.Item>
                )}
            />

            {/* Brands */}
            <h3 className="mt-6">Thương hiệu áp dụng</h3>
            <Space style={{ marginBottom: 8 }}>
                <Select
                    style={{ width: 260 }}
                    options={brandOptions}
                    value={selectedBrand}
                    onChange={(value) => setSelectedBrand(value)}
                    placeholder="Chọn thương hiệu"
                    allowClear
                />
                <Button type="primary" onClick={() => handleLink("brand")}>
                    Thêm thương hiệu
                </Button>
            </Space>
            <List
                loading={loading}
                dataSource={relations?.brands ?? []}
                renderItem={(b: any) => (
                    <List.Item
                        actions={[
                            <Button
                                key="unlink"
                                danger
                                type="link"
                                onClick={() => handleUnlink("brand", b._id)}
                            >
                                Bỏ liên kết
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta title={b.brand_name} />
                    </List.Item>
                )}
            />

            {/* Products */}
            <h3 className="mt-6">Sản phẩm áp dụng</h3>
            <Space style={{ marginBottom: 8 }}>
                <Select
                    style={{ width: 260 }}
                    options={productOptions}
                    value={selectedProduct}
                    onChange={(value) => setSelectedProduct(value)}
                    placeholder="Chọn sản phẩm"
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label as string)
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                    allowClear
                />
                <Button type="primary" onClick={() => handleLink("product")}>
                    Thêm sản phẩm
                </Button>
            </Space>
            <List
                loading={loading}
                dataSource={relations?.products ?? []}
                renderItem={(p: any) => (
                    <List.Item
                        actions={[
                            <Button
                                key="unlink"
                                danger
                                type="link"
                                onClick={() => handleUnlink("product", p._id)}
                            >
                                Bỏ liên kết
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta title={p.product_name} description={p.slug} />
                    </List.Item>
                )}
            />
        </Drawer>
    );
};

export default PromotionRelationsDrawer;
