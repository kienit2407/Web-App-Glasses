/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card as ShadCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { API } from "@/app/lib/axios-client";
import {
    message,
    Table,
    Radio,
    Input,
    Tag,
    Space,
    Modal,
    Typography,
    Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ShoppingBag } from "lucide-react";
import { useCheckoutStore } from "@/hooks/use-checkout-preview";
import { useCart } from "@/hooks/use-cart";
import { useCouponStore } from "@/hooks/use-coupon";
import { CreateAddressModal } from "../components/CreateAddressModal";

const { Title, Text } = Typography;

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);

// ==== types ====
type Address = {
    _id: string;
    recipient_name: string;
    phone: string;
    province_code: string;
    district_code: string;
    ward_code: string;
    specific_address: string;
    is_default?: boolean;
    province_name: string,
    district_name: string,
    ward_name: string,
    full_address: string
};
type UserCouponItem = {
    _id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    // các field tính sẵn từ BE
    can_use: boolean;
    is_expired: boolean;
    missing_amount?: number; // nếu !can_use vì chưa đủ min_order
};
type OrderItemPreview = {
    product_id: string;
    variant_id: string;
    sku: string | null;
    name: string;
    attributes: {
        frame_material?: string;
        frame_color?: string;
        frame_shape?: string;
        lens_width?: string;
        lens_height?: string;
        temple_length?: string;
        bridge_width?: string;
        has_uv_protection?: boolean;
    };
    unit_price: number;
    quantity: number;
    total: number;
};

type AppliedCoupon = {
    _id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
} | null;

type AppliedPromotion = {
    _id: string;
    title: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    max_discount?: number | null;
    min_order?: number | null;
} | null;

type CheckoutPreview = {
    shipping_address: {
        recipient_name: string;
        phone: string;
        province_code: string;
        district_code: string;
        ward_code: string;
        specific_address: string;
    };
    orderItemsData: OrderItemPreview[];
    subtotal: number;
    discount_amount: number;
    shipping_fee: number;
    total_amount: number;
    applied_coupon?: AppliedCoupon;
    applied_promotion?: AppliedPromotion;
    discount_source?: "none" | "coupon" | "promotion";
};

type PaymentMethod = "cod" | "vnpay";

interface LocationState {
    cartItemIds?: string[];
    directItem?: {
        variant_id: string;
        quantity: number;
    };
}
interface Province {
    code: string;
    name: string;
}
interface District {
    code: string;
    name: string;
}
interface Ward {
    code: string;
    name: string;
}
const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItemIds = [], directItem } = (location.state || {}) as LocationState;
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        null
    );

    const { cart, fetchCart } = useCart();
    const [preview, setPreview] = useState<CheckoutPreview | null>(null);
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("cod");
    const [note, setNote] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voucherModalOpen, setVoucherModalOpen] = useState(false);

    const [addressModalOpen, setAddressModalOpen] = useState(false);

    const [createAddressOpen, setCreateAddressOpen] = useState(false);

    const isCartMode = !!cartItemIds && cartItemIds.length > 0;
    const isDirectMode = !!directItem;
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const {
        couponInput,
        setCouponInput,
        appliedCouponCode,
        couponInfo,
        isCheckingCoupon,
        applyCoupon,
        clearCoupon,
    } = useCheckoutStore();
    const {
        myCoupons,
        myCouponsLoading,
        fetchMyCoupons,
    } = useCouponStore();

    useEffect(() => {
        if (!isCartMode && !isDirectMode) {
            message.warning("Vui lòng chọn sản phẩm trước");
            navigate("/cart");
        }
    }, [isCartMode, isDirectMode, navigate]);


    const openVoucherModal = async () => {
        if (!preview) return;
        await fetchMyCoupons({ subtotal: preview.subtotal });
        setVoucherModalOpen(true);
        console.log(myCoupons)
    };

    const handleUseVoucher = async (coupon: UserCouponItem) => {
        if (!preview) return;
        if (!coupon.can_use || coupon.is_expired) return;

        // chọn voucher => set code và dùng lại logic applyCoupon hiện tại
        setCouponInput(coupon.code);
        await applyCoupon(preview.subtotal);
        setVoucherModalOpen(false);
    };
    const fetchAddresses = async () => {
        try {
            const res = await API.get("/users/me/address");
            const data = res.data?.data;

            const list: Address[] = data?.addresses || [];
            setAddresses(list);

            if (list.length === 0) {
                // không có địa chỉ mở modal tạo mới
                setSelectedAddressId(null);
                setAddressModalOpen(false);
                setCreateAddressOpen(true);
                return;
            }

            const def =
                list.find((a) => a._id === data?.default_address_id) ||
                list.find((a) => a.is_default) ||
                list[0];

            if (def) {
                setSelectedAddressId(def._id);
            }
        } catch (err) {
            console.error(err);
            message.error("Không lấy được danh sách địa chỉ");
        }
    };

    // Lấy danh sách địa chỉ
    useEffect(() => {
        fetchAddresses();
        fetchProvinces()
    }, []);

    // Gọi /checkout/preview mỗi khi address hoặc couponCode thay đổi
    useEffect(() => {
        const runPreview = async () => {
            if (!selectedAddressId || (!isCartMode && !isDirectMode)) return;

            setIsLoading(true);
            try {
                const body: any = {
                    address_id: selectedAddressId,
                    coupon_code: appliedCouponCode || null,
                };

                if (isCartMode) {
                    body.cart_item_ids = cartItemIds;
                } else if (isDirectMode && directItem) {
                    body.items = [
                        {
                            variant_id: directItem.variant_id,
                            quantity: directItem.quantity,
                        },
                    ];
                }

                const res = await API.post("/checkout/preview", body);
                setPreview(res.data?.data);
            } catch (err: any) {
                console.error(err);
                const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.msg ||
                    "Không preview được đơn hàng";
                message.error(msg);

                // Lưu ý: gọi clearCoupon() sẽ không được đưa vào dependency nữa
                if (appliedCouponCode) {
                    clearCoupon();
                }
            } finally {
                setIsLoading(false);
            }
        };

        runPreview();
    }, [selectedAddressId, appliedCouponCode]);

    const fetchProvinces = async () => {
        try {
            const res = await API.get("/geo/provinces");
            setProvinces(res.data?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDistricts = async (province_code: string) => {
        try {
            const res = await API.get("/geo/districts", {
                params: { province_code },
            });
            setDistricts(res.data?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWards = async (district_code: string) => {
        try {
            const res = await API.get("/geo/wards", {
                params: { district_code },
            });
            setWards(res.data?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const selectedAddress = useMemo(
        () =>
            addresses.find((a) => a._id === selectedAddressId) || null,
        [addresses, selectedAddressId]
    );

    const addressLine1 = selectedAddress
        ? `${selectedAddress.recipient_name} (${selectedAddress.phone})`
        : "";

    const provinceName = useMemo(() => {
        if (!selectedAddress) return "";
        const p = provinces.find(
            (x) => x.code === selectedAddress.province_code
        );
        return p?.name || selectedAddress.province_code;
    }, [provinces, selectedAddress]);

    const districtName = useMemo(() => {
        if (!selectedAddress) return "";
        const d = districts.find(
            (x) => x.code === selectedAddress.district_code
        );
        return d?.name || selectedAddress.district_code;
    }, [districts, selectedAddress]);

    const wardName = useMemo(() => {
        if (!selectedAddress) return "";
        const w = wards.find((x) => x.code === selectedAddress.ward_code);
        return w?.name || selectedAddress.ward_code;
    }, [wards, selectedAddress]);

    const addressLine2 = selectedAddress
        ? `${selectedAddress.specific_address}`
        : "";
    useEffect(() => {
        if (selectedAddress?.province_code) {
            fetchDistricts(selectedAddress.province_code);
        }
    }, [selectedAddress?.province_code]);

    // Khi đã có selectedAddress -> load danh sách phường của quận đó
    useEffect(() => {
        if (selectedAddress?.district_code) {
            fetchWards(selectedAddress.district_code);
        }
    }, [selectedAddress?.district_code]);

    // Table columns
    const columns: ColumnsType<OrderItemPreview> = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-medium">{record.name}</span>
                    <span className="text-xs text-gray-500">
                        {record.attributes?.frame_shape &&
                            `${record.attributes.frame_shape} • `}
                        {record.attributes?.frame_color}
                        {record.attributes?.lens_width &&
                            ` • ${record.attributes.lens_width}-${record.attributes.bridge_width}-${record.attributes.temple_length}`}
                    </span>
                    {record.sku && (
                        <span className="text-xs text-gray-400">
                            SKU: {record.sku}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "unit_price",
            key: "unit_price",
            align: "right",
            render: (v: number) => <span>{formatPrice(v)}</span>,
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            key: "quantity",
            align: "center",
        },
        {
            title: "Thành tiền",
            dataIndex: "total",
            key: "total",
            align: "right",
            render: (v: number) => (
                <span className="font-semibold text-primary">
                    {formatPrice(v)}
                </span>
            ),
        },
    ];

    const handlePlaceOrder = async () => {
        if (!preview || !selectedAddressId) return;
        setIsSubmitting(true);
        try {
            const payload: any = {
                address_id: selectedAddressId,
                note: note || null,
                coupon_code: appliedCouponCode || null,
                payment_method: paymentMethod, 
            };

            if (isCartMode) {
                payload.cart_item_ids = cartItemIds;
            } else if (isDirectMode && directItem) {
                payload.items = [
                    {
                        variant_id: directItem.variant_id,
                        quantity: directItem.quantity,
                    },
                ];
            }

            const createRes = await API.post("/orders", payload);

            const { order } = createRes.data?.data || {};
            if (!order?._id) {
                throw new Error("Không lấy được thông tin đơn hàng");
            }

            if (paymentMethod === "cod") {
                await API.post("/payments/cod/confirm", {
                    order_id: order._id,
                });
                message.success("Đặt hàng thành công với hình thức COD");
                await fetchCart();
                navigate(
                    `/payment-result?vnp_status=success&order_id=${order._id}&method=cod`
                );
            } else {
                const returnUrl = `${window.location.origin}/payment-result`;
                const payRes = await API.post("/payments/vnpay/create", {
                    order_id: order._id,
                    returnUrl,
                });
                const paymentUrl = payRes.data?.data?.payment_url;
                if (!paymentUrl) {
                    throw new Error("Không tạo được link thanh toán VNPay");
                }
                window.location.href = paymentUrl;
            }
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message || "Đặt hàng thất bại";
            message.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };
    if (createAddressOpen && !selectedAddressId && !preview) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <CreateAddressModal
                    open={createAddressOpen}
                    onClose={() => setCreateAddressOpen(false)}
                    onSuccess={async (newId) => {
                        await fetchAddresses();
                        if (newId) {
                            setSelectedAddressId(newId);
                        }
                        setCreateAddressOpen(false);
                    }}
                />
            </div>
        );
    }
    if (isLoading && !preview) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin size="small" />
            </div>
        );
    }
    // nếu mà không chịku set địa chỉ thì sẽ trả về giỏ hàng k cho checkou

    if (!preview || !selectedAddress) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                <p>Không thể tải thông tin thanh toán. Vui lòng quay lại giỏ hàng.</p>
                <Link to="/cart">
                    <Button>Quay lại giỏ hàng</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-[#fafafa]">
            <div className="container mx-auto px-4">
                <Title level={3} className="mb-4">
                    Thanh toán
                </Title>

                <div className="grid grid-cols-1 xl:grid-cols-[2.5fr,1.2fr] gap-8">
                    {/* LEFT */}
                    <div className="space-y-4">
                        {/* Địa chỉ nhận hàng */}
                        <ShadCard className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Title level={5} className="!mb-0">
                                            Địa chỉ nhận hàng
                                        </Title>
                                        {selectedAddress.is_default && (
                                            <Tag color="red">Mặc định</Tag>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="font-medium">{addressLine1}</div>
                                        <div className="text-gray-600">{addressLine2}</div>
                                        <div className="text-gray-600">{selectedAddress.full_address}</div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAddressModalOpen(true)}
                                >
                                    Thay đổi
                                </Button>
                            </div>
                        </ShadCard>

                        {/* Sản phẩm */}
                        <ShadCard className="p-0 overflow-hidden">
                            {/* desktop table */}
                            <div className="hidden md:block px-5 pb-5 w-full">
                                <Table<OrderItemPreview>
                                    columns={columns}
                                    dataSource={preview.orderItemsData}
                                    pagination={false}
                                    rowKey={(r) => `${r.product_id}-${r.variant_id}`}
                                    size="small"
                                    scroll={{ x: "max-content" }}
                                />
                            </div>

                            {/* mobile list */}
                            <div className="md:hidden px-4 pb-4 space-y-3">
                                {preview.orderItemsData.map((item) => (
                                    <div
                                        key={`${item.product_id}-${item.variant_id}`}
                                        className="border rounded-lg p-3 bg-white shadow-sm"
                                    >
                                        <div className="flex justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {item.name}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {item.attributes?.frame_shape &&
                                                        `${item.attributes.frame_shape} • `}
                                                    {item.attributes?.frame_color}
                                                </div>
                                                <div className="text-xs mt-1">
                                                    Đơn giá:{" "}
                                                    <span className="font-semibold">
                                                        {formatPrice(item.unit_price)}
                                                    </span>
                                                </div>
                                                <div className="text-xs">
                                                    Số lượng: <strong>{item.quantity}</strong>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm font-semibold text-primary">
                                                {formatPrice(item.total)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ShadCard>

                        <ShadCard className="p-5 space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Title level={5} className="!mb-0">
                                        Voucher
                                    </Title>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                    <div className="flex gap-2 flex-1">
                                        <Input
                                            placeholder="Nhập mã giảm giá"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value)}
                                        />
                                        <Button onClick={() => applyCoupon(preview.subtotal)}>
                                            Áp dụng
                                        </Button>
                                        {appliedCouponCode && (
                                            <Button
                                                type="button"
                                                onClick={clearCoupon}
                                                disabled={isCheckingCoupon}
                                            >
                                                Xoá
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={openVoucherModal}
                                    >
                                        Chọn voucher
                                    </Button>
                                </div>
                            </div>

                            {couponInfo && (
                                <Text type="success" className="text-xs block">
                                    Mã <strong>{couponInfo.code}</strong>{" "}
                                    {couponInfo.type === "percent"
                                        ? `giảm ${couponInfo.value}%`
                                        : `giảm ${formatPrice(couponInfo.value)}`}
                                    {couponInfo.min_order && (
                                        <> (ĐH từ {formatPrice(couponInfo.min_order)})</>
                                    )}
                                </Text>
                            )}

                            {preview.discount_source === "promotion" &&
                                preview.applied_promotion && (
                                    <Text type="secondary" className="text-xs block mt-1">
                                        Hệ thống đang áp dụng khuyến mãi{" "}
                                        <strong>{preview.applied_promotion.title}</strong>{" "}
                                        tự động trên đơn hàng. Mã giảm giá nhập thêm sẽ
                                        không cộng dồn, hệ thống luôn chọn mức giảm tốt hơn.
                                    </Text>
                                )}

                            {appliedCouponCode &&
                                preview.discount_source === "promotion" && (
                                    <Text type="warning" className="text-xs block mt-1">
                                        Mã <strong>{appliedCouponCode}</strong> không được
                                        áp dụng vì khuyến mãi hiện tại mang lại ưu đãi
                                        cao hơn.
                                    </Text>
                                )}

                            {preview.discount_source === "coupon" &&
                                preview.applied_coupon && (
                                    <Text type="success" className="text-xs block mt-1">
                                        Đang áp dụng mã{" "}
                                        <strong>{preview.applied_coupon.code}</strong> cho
                                        đơn hàng.
                                    </Text>
                                )}

                            <Separator />

                            {/* Lời nhắn */}
                            <div className="space-y-2">
                                <Text strong>Lời nhắn cho Người bán</Text>
                                <Input.TextArea
                                    rows={2}
                                    maxLength={200}
                                    showCount
                                    placeholder="Lưu ý cho shop (không bắt buộc)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <Separator />
                            {/* Payment method */}
                            <div className="space-y-2">
                                <Text strong className="mr-5">
                                    Phương thức thanh toán
                                </Text>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <Space direction="vertical">
                                        <Radio value="cod">
                                            Thanh toán khi nhận hàng (COD)
                                        </Radio>
                                        <Radio value="vnpay">
                                            Thanh toán qua VNPay
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>
                        </ShadCard>
                    </div>


                    <div>
                        <ShadCard className="p-5 space-y-4 sticky top-16">
                            <Title level={5}>Thông tin thanh toán</Title>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Tổng tiền hàng</span>
                                    <span>{formatPrice(preview.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Giảm giá</span>
                                    <span className="text-green-600">
                                        -{formatPrice(preview.discount_amount)}
                                    </span>
                                </div>

                                {/* hiển thị nguồn giảm giá */}
                                {preview.discount_amount > 0 && (
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Nguồn giảm</span>
                                        <span className="text-right">
                                            {preview.discount_source === "coupon" &&
                                                preview.applied_coupon && (
                                                    <>
                                                        Mã:{" "}
                                                        <strong>
                                                            {preview.applied_coupon.code}
                                                        </strong>
                                                    </>
                                                )}
                                            {preview.discount_source === "promotion" &&
                                                preview.applied_promotion && (
                                                    <>
                                                        KM:{" "}
                                                        <strong>
                                                            {preview.applied_promotion.title}
                                                        </strong>
                                                    </>
                                                )}
                                            {(!preview.discount_source ||
                                                preview.discount_source === "none") &&
                                                "Khác"}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span>Phí vận chuyển</span>
                                    <span>{formatPrice(preview.shipping_fee)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">
                                        Tổng thanh toán
                                    </span>
                                    <span className="text-lg font-bold text-red-500">
                                        {formatPrice(preview.total_amount)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-2"
                                size="lg"
                                disabled={isSubmitting}
                                onClick={handlePlaceOrder}
                            >
                                {isSubmitting ? (
                                    <span>
                                        <Spin size="small" /> Đang xử lý...
                                    </span>
                                ) : paymentMethod === "cod" ? (
                                    "Đặt hàng"
                                ) : (
                                    "Thanh toán VNPay"
                                )}
                            </Button>

                            <Link to="/cart">
                                <Button
                                    variant="outline"
                                    className="w-full mt-3"
                                >
                                    Quay lại giỏ hàng
                                </Button>
                            </Link>
                        </ShadCard>
                    </div>
                </div>
            </div>
            <Modal
                title="Voucher của bạn"
                open={voucherModalOpen}
                onCancel={() => setVoucherModalOpen(false)}
                footer={null}
                width={520}
            >
                {myCouponsLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Spinner />
                    </div>
                ) : myCoupons.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-4">
                        Bạn chưa lưu voucher nào.
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                        {myCoupons.map((c) => {
                            const canUse = c.can_use && !c.is_expired;
                            const missing =
                                !canUse && c.missing_amount && c.missing_amount > 0
                                    ? c.missing_amount
                                    : 0;

                            const hsd = c.end_date
                                ? new Date(c.end_date).toLocaleDateString("vi-VN")
                                : "Không giới hạn";

                            return (
                                <div
                                    key={c._id}
                                    className="border rounded-lg p-3 bg-white flex justify-between gap-3 opacity-100"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold">
                                            {c.type === "percent"
                                                ? `Giảm ${c.value}%`
                                                : `Giảm ${formatPrice(c.value)}`}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Đơn tối thiểu{" "}
                                            {c.min_order ? formatPrice(c.min_order) : "0đ"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            HSD: {hsd}
                                        </div>
                                        {missing > 0 && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Mua thêm {formatPrice(missing)} để sử dụng voucher này
                                            </div>
                                        )}
                                        {c.is_expired && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Voucher đã hết hạn
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end justify-between">
                                        <Tag color="blue" className="mb-2">
                                            {c.code}
                                        </Tag>
                                        <Button
                                            disabled={!canUse}
                                            onClick={() => handleUseVoucher(c)}
                                        >
                                            {canUse ? "Dùng" : "Không đủ điều kiện"}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
            {/* Modal chọn địa chỉ */}
            <Modal
                title="Chọn địa chỉ nhận hàng"
                open={addressModalOpen}
                onCancel={() => setAddressModalOpen(false)}
                onOk={() => setAddressModalOpen(false)}
                okText="Xong"
                cancelText="Huỷ"
            >
                <Radio.Group
                    className="w-full"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                    <Space direction="vertical" className="w-full">
                        {addresses.map((addr) => (
                            <Radio key={addr._id} value={addr._id} className="w-full">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {addr.recipient_name} ({addr.phone})
                                        </span>
                                        {addr.is_default && <Tag color="red">Mặc định</Tag>}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        {addr.specific_address}
                                    </span>
                                </div>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>

                <div className="mt-3">
                    <Button


                        onClick={() => {
                            setAddressModalOpen(false);
                            setCreateAddressOpen(true);
                        }}
                    >
                        + Thêm địa chỉ mới
                    </Button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                    Bạn có thể vào trang "Địa chỉ" để thêm / sửa địa chỉ mới.
                </div>
            </Modal>
            <CreateAddressModal
                open={createAddressOpen}
                onClose={() => setCreateAddressOpen(false)}
                onSuccess={async (newId) => {
                    // Sau khi tạo xong:
                    await fetchAddresses();
                    if (newId) {
                        setSelectedAddressId(newId);
                    }
                    setCreateAddressOpen(false);
                }}
            />
        </div>
    );
};

export default Checkout;
