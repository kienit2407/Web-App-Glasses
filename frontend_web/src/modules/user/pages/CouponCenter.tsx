// src/pages/CouponCenter.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
    Button,
    Tag,
    message,
    Typography,
    Modal,
    Statistic,
    Tooltip,
} from "antd";
import { Spinner } from "@/components/ui/spinner";
import { Card as ShadCard } from "@/components/ui/card";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

type CouponCenterItem = {
    _id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    start_date: string;
    end_date?: string | null;
    is_saved: boolean;
    is_used: boolean;
};

type PromotionCenterItem = {
    _id: string;
    title: string;
    description?: string;
    banner_url?: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    max_discount?: number | null;
    min_order?: number | null;
    start_date: string;
    end_date?: string | null;
};

type HighlightPromotion = {
    _id: string;
    title: string;
    description?: string;
    banner_url?: string;
    start_date: string;
    end_date?: string | null;
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);

const CouponCenter = () => {
    const [coupons, setCoupons] = useState<CouponCenterItem[]>([]);
    const [promotions, setPromotions] = useState<PromotionCenterItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const navigate = useNavigate()
    // highlight popup
    const [highlight, setHighlight] = useState<HighlightPromotion | null>(null);
    const [highlightOpen, setHighlightOpen] = useState(false);
    const [markingSeen, setMarkingSeen] = useState(false);
    const { user } = useAuth()
    // ====== fetch coupon center (coupon) ======
    const fetchCoupons = async () => {
        try {
            const res = await API.get("/coupons");
            const data: CouponCenterItem[] = res.data?.data?.items || [];
            setCoupons(data);
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.msg ||
                "Không tải được danh sách voucher";
            message.error(msg);
        }
    };

    // ====== fetch promotions cho center ======
    const fetchPromotions = async () => {
        try {
            const res = await API.get("/promotions/center");
            const data: PromotionCenterItem[] = res.data?.data?.items || [];
            setPromotions(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    // // ====== fetch highlight promotion cho popup ======
    // const fetchHighlight = async () => {
    //     try {
    //         const res = await API.get("/promotions/highlight");
    //         const data = res.data?.data as {
    //             promotion: HighlightPromotion | null;
    //             already_seen: boolean;
    //         };

    //         if (data?.promotion && !data.already_seen) {
    //             setHighlight(data.promotion);
    //             setHighlightOpen(true);
    //         }
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchCoupons(), fetchPromotions()]);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (coupon: CouponCenterItem) => {
        if (coupon.is_saved) return;
        try {
            if (!user) {
                navigate('/login')
                message.success("Bạn cần đăng nhập để lưu voucher");
                return
            }

            setSavingId(coupon._id);
            await API.post(`/coupons/claim/${encodeURIComponent(coupon.code)}`);
            message.success("Đã lưu voucher vào kho của bạn");

            setCoupons((prev) =>
                prev.map((it) =>
                    it._id === coupon._id ? { ...it, is_saved: true } : it
                )
            );
        } catch (err: any) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.mgs ||
                "Không lưu được voucher";
            message.error(msg);
        } finally {
            setSavingId(null);
        }
    };

    const handleCloseHighlight = async () => {
        if (!highlight) {
            setHighlightOpen(false);
            return;
        }
        try {
            setMarkingSeen(true);
            await API.post(`/promotions/${highlight._id}/seen`);
        } catch (err) {
            console.error(err);
        } finally {
            setMarkingSeen(false);
            setHighlightOpen(false);
        }
    };

    // Helper: render trạng thái thời gian cho coupon/promotion
    const renderTimeStatus = (start: string, end?: string | null) => {
        const now = dayjs();
        const startDate = dayjs(start);
        const endDate = end ? dayjs(end) : null;

        if (now.isBefore(startDate)) {
            // sắp diễn ra
            return (
                <div className="text-xs text-orange-500 mt-1">
                    <span className="mr-1">Sắp diễn ra:</span>
                    <Countdown
                        value={startDate.valueOf()}
                        format="DD ngày HH:mm:ss"
                    />
                </div>
            );
        }

        if (endDate && now.isBefore(endDate)) {
            // đang diễn ra, còn thời gian
            return (
                <div className="text-xs text-green-600 mt-1">
                    <span className="mr-1">Còn lại:</span>
                    <Countdown
                        value={endDate.valueOf()}
                        format="DD ngày HH:mm:ss"
                    />
                </div>
            );
        }

        if (!endDate) {
            return (
                <div className="text-xs text-green-600 mt-1">
                    Đang diễn ra (không giới hạn thời gian)
                </div>
            );
        }

        // đã kết thúc
        const diffDays = now.diff(endDate, "day");
        return (
            <div className="text-xs text-gray-400 mt-1">
                Đã kết thúc {Math.abs(diffDays)} ngày trước
            </div>
        );
    };

    // ====== RENDER ======
    return (
        <div className="min-h-screen py-8 bg-[#fafafa]">
            <div className="container mx-auto px-4 space-y-6">
                <Title level={3} className="mb-0">
                    Kho ưu đãi & voucher
                </Title>
                <Text className="text-sm text-gray-500">
                    Lưu voucher và theo dõi các chương trình khuyến mãi đang diễn ra.
                </Text>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner />
                    </div>
                ) : (
                    <>
                        {/* PROMOTIONS GRID */}
                        {promotions.length > 0 && (
                            <div className="space-y-2">
                                <Title level={4} className="!mb-0">
                                    Chương trình khuyến mãi
                                </Title>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                                    {promotions.map((p) => {
                                        const hsd = p.end_date
                                            ? new Date(p.end_date).toLocaleDateString(
                                                "vi-VN"
                                            )
                                            : "Không giới hạn";

                                        const discountText =
                                            p.discount_type === "percent"
                                                ? `Giảm ${p.discount_value}%`
                                                : `Giảm ${formatPrice(p.discount_value)}`;

                                        return (
                                            <ShadCard
                                                key={p._id}
                                                className="p-0 overflow-hidden flex flex-col border border-orange-200"
                                            >
                                                {p.banner_url && (
                                                    <div className="min-h-50 w-full  overflow-hidden">
                                                        <img
                                                            src={p.banner_url}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-3 flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between gap-2">

                                                        <Tag color="volcano" className="text-[14px]">
                                                            {p.title}
                                                        </Tag>

                                                    </div>

                                                    {p.description && (
                                                        <Text
                                                            type="secondary"
                                                            className="text-xs mt-1 line-clamp-2"
                                                        >
                                                            {p.description}
                                                        </Text>
                                                    )}

                                                    <div className="mt-2 text-xs">
                                                        <div>
                                                            Ưu đãi:{" "}
                                                            <Text strong>{discountText}</Text>
                                                            {p.max_discount != null && (
                                                                <span>
                                                                    {" "}
                                                                    (tối đa{" "}
                                                                    {formatPrice(
                                                                        p.max_discount
                                                                    )}
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-600">
                                                            Đơn tối thiểu:{" "}
                                                            {p.min_order
                                                                ? formatPrice(p.min_order)
                                                                : "Không yêu cầu"}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            HSD: {hsd}
                                                        </div>
                                                    </div>

                                                    {renderTimeStatus(
                                                        p.start_date,
                                                        p.end_date
                                                    )}
                                                </div>
                                            </ShadCard>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* COUPONS GRID */}
                        <div className="space-y-2">
                            <Title level={4} className="!mb-0">
                                Voucher của shop
                            </Title>

                            {coupons.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-6">
                                    Hiện tại shop chưa có voucher nào.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                    {coupons.map((c) => {
                                        const hsd = c.end_date
                                            ? new Date(c.end_date).toLocaleDateString(
                                                "vi-VN"
                                            )
                                            : "Không giới hạn";

                                        const discountText =
                                            c.type === "percent"
                                                ? `Giảm ${c.value}%`
                                                : `Giảm ${formatPrice(c.value)}`;

                                        const disabled = c.is_saved || !!savingId;

                                        return (
                                            <ShadCard
                                                key={c._id}
                                                className="p-3 flex flex-col border border-blue-200"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="text-sm font-semibold">
                                                            {discountText}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            Đơn tối thiểu{" "}
                                                            {c.min_order
                                                                ? formatPrice(c.min_order)
                                                                : "0đ"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            HSD: {hsd}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-5">
                                                        <Tag color="blue">Voucher</Tag>
                                                        <Tooltip
                                                            title={
                                                                c.is_saved
                                                                    ? "Voucher đã có trong kho"
                                                                    : "Lưu voucher vào kho"
                                                            }
                                                        >
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                variant="filled"
                                                                color="green"
                                                                style={{
                                                                    borderColor: c.is_saved ? '#D1D5DB' : '#16A34A',
                                                                    borderWidth: 1
                                                                }}
                                                                disabled={disabled}
                                                                loading={savingId === c._id}
                                                                onClick={() =>
                                                                    handleSave(c)
                                                                }
                                                            >
                                                                {c.is_saved
                                                                    ? "Đã lưu"
                                                                    : "Lưu"}
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </div>

                                                {renderTimeStatus(
                                                    c.start_date,
                                                    c.end_date
                                                )}
                                            </ShadCard>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 text-xs text-gray-500">
                            Các voucher đã lưu có thể xem lại và sử dụng ở trang{" "}
                            <Text strong>“Kho voucher của tôi”</Text> hoặc trong bước
                            thanh toán.
                        </div>
                    </>
                )}


                <Modal
                    open={highlightOpen}
                    onCancel={handleCloseHighlight}
                    onOk={handleCloseHighlight}
                    confirmLoading={markingSeen}
                    okText="Đã hiểu"
                    cancelText="Đóng"
                    title={highlight?.title || "Khuyến mãi nổi bật"}
                    centered
                >
                    {highlight ? (
                        <div className="space-y-3">
                            {highlight.banner_url && (
                                <div className="w-full h-40 overflow-hidden rounded-md">
                                    <img
                                        src={highlight.banner_url}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {highlight.description && (
                                <Text className="text-sm block">
                                    {highlight.description}
                                </Text>
                            )}
                            <div className="text-xs text-gray-600">
                                {renderTimeStatus(
                                    highlight.start_date,
                                    highlight.end_date
                                )}
                            </div>
                            <Text className="text-xs text-gray-500 block">
                                Bạn chỉ nhìn thấy popup này một lần cho mỗi chương
                                trình khuyến mãi.
                            </Text>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                            Không có khuyến mãi nổi bật.
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default CouponCenter;
