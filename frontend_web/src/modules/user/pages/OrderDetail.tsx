/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OrderDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { API } from "@/app/lib/axios-client";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tag, Steps, Breadcrumb, Button, message, Modal, QRCode, Divider } from "antd";
import { format } from "date-fns";
import { MoveLeft, QrCode } from "lucide-react";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { Separator } from "@radix-ui/react-dropdown-menu";
const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(p);
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
// Map trạng thái -> label + màu
const ORDER_STATUS_LABEL: Record<string, string> = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivering: "Đang giao",
    delivered: "Hoàn thành",
    cancelled: "Đã hủy",
    returned: "Đã trả hàng",
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
    success: "green",
    failed: "red",
};
const ORDER_STATUS_COLOR: Record<string, string> = {
    pending: "gold",
    processing: "blue",
    shipping: "cyan",
    delivering: "cyan",
    delivered: "green",
    cancelled: "red",
    returned: "purple",
};

// Steps theo lifecycle cơ bản
const ORDER_STEPS = [
    { key: "pending", title: "Chờ xác nhận" },
    { key: "processing", title: "Đang xử lý" },
    { key: "shipping", title: "Đang giao" },
    { key: "delivered", title: "Hoàn thành" },
];

const OrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isOpenQrCode, setOpen] = useState(false)
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const orderUrl = `${window.location.origin}${location.pathname}`;
    useEffect(() => {
        if (!id) return;
        const run = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const res = await API.get(`/orders/${id}`);
                setData(res.data?.data);
            } catch (err) {
                console.error(err);
                setErrorMsg("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);
    useEffect(() => {
        if (!data?.order?.shipping_address) return;

        const { province_code, district_code } = data.order.shipping_address;

        const run = async () => {
            try {
                const [provRes, distRes, wardRes] = await Promise.all([
                    API.get("/geo/provinces"),
                    API.get("/geo/districts", { params: { province_code } }),
                    API.get("/geo/wards", { params: { district_code } }),
                ]);

                setProvinces(provRes.data?.data || []);
                setDistricts(distRes.data?.data || []);
                setWards(wardRes.data?.data || []);
            } catch (err) {
                console.error("Load địa chỉ lỗi:", err);
            }
        };

        run();
    }, [
        data?.order?.shipping_address?.province_code,
        data?.order?.shipping_address?.district_code,
    ]);
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!data || errorMsg) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-6 max-w-md text-center space-y-3">
                    <p className="font-semibold text-lg">Không tìm thấy đơn hàng</p>
                    <p className="text-sm text-muted-foreground">
                        {errorMsg || "Đơn hàng có thể đã bị xóa hoặc bạn không có quyền truy cập."}
                    </p>
                    <Button

                        variant="filled"
                        color="blue"
                    >
                        <MoveLeft />
                        <Link to="/orders" className="text-primary text-sm">
                            Quay lại danh sách đơn hàng
                        </Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const { order, items } = data;
    const provinceName =
        provinces.find((p) => p.code === order.shipping_address.province_code)?.name ??
        order.shipping_address.province_code;

    const districtName =
        districts.find((d) => d.code === order.shipping_address.district_code)?.name ??
        order.shipping_address.district_code;

    const wardName =
        wards.find((w) => w.code === order.shipping_address.ward_code)?.name ??
        order.shipping_address.ward_code;
    const rawStatus: string = order.order_status;
    const statusLabel = ORDER_STATUS_LABEL[rawStatus] || rawStatus;
    const statusColor = ORDER_STATUS_COLOR[rawStatus] || "default";
    const statusPaymentColor = PAYMENT_STATUS_COLOR[order.payment_status]

    // Map delivering -> shipping cho thanh bước
    const normalizedStatusForStep =
        rawStatus === "delivering" ? "shipping" : rawStatus;

    const currentStepIndex = ORDER_STEPS.findIndex(
        (s) => s.key === normalizedStatusForStep
    );
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // Chỉ hiển thị Steps khi trạng thái thuộc các step này
    const showSteps = currentStepIndex >= 0;

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-baseline">
                            Đơn hàng # <Paragraph copyable className="font-medium text-2xl text-blue-500">
                                {order.order_number}
                            </Paragraph>
                        </h1>

                        <div className="flex gap-4">
                            <p className="text-sm text-muted-foreground mt-1">
                                Ngày đặt:{" "}
                                {order.createdAt
                                    ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")
                                    : "--"}
                            </p>
                            <Button
                                onClick={showModal}
                                variant="filled"
                                color="blue"
                            >
                                <QrCode />
                            </Button>
                        </div>
                        <Breadcrumb
                            className="my-5 [&_a]:text-blue-600"
                            items={[
                                { title: <Link to="/account/orders" className="hover:text-blue text-black">Đơn mua</Link> },
                                { title: "Chi tiết đơn hàng" },
                            ]}

                        />
                        <div className="flex items-center">
                            <Button

                                variant="filled"
                                color="blue"
                            >
                                <MoveLeft />
                                <Link to="/orders" className="text-primary text-sm">
                                    Quay lại
                                </Link>
                            </Button>
                            <Modal
                                title={null}       
                                open={isModalOpen}
                                onCancel={handleCancel}
                                footer={null}
                                centered
                                width={260}
                                bodyStyle={{
                                    padding: 16,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <QRCode
                                        value={orderUrl}
                                        size={150}

                                        icon="/glasses.png"
                                    ></QRCode>
                                    <div className="text-sm font-semibold text-blue-500">
                                        {order.order_number}
                                    </div>
                                </div>
                            </Modal>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                        <Tag color={statusColor} className="text-sm px-3 py-1 rounded-full">
                            {statusLabel}
                        </Tag>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
                            <p className="text-xl font-bold text-red-500">
                                {formatPrice(order.total_amount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Steps trạng thái – ẨN khi đơn đã hủy / trả hàng / trạng thái khác */}
                {showSteps && (
                    <Card className="p-4">
                        <Steps
                            size="small"
                            current={currentStepIndex}
                            items={ORDER_STEPS.map((s) => ({ title: s.title }))}
                        />
                    </Card>
                )}

                {/* Info 2 cột: bên trái shipping, bên phải payment/summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shipping info */}
                    <Card className="p-4 space-y-2">
                        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                            Thông tin nhận hàng
                        </h2>
                        <div className="space-y-2 text-sm">
                            <p className="font-medium">
                                Người nhận: {order.shipping_address.recipient_name}{" "}
                                <span className="text-muted-foreground">
                                    ({order.shipping_address.phone})
                                </span>
                            </p>
                            <Divider />
                            <Title level={5}>Địa chỉ:</Title>
                            <div>
                                <p>{order.shipping_address.specific_address}</p>
                                <p className="text-muted-foreground">
                                    {wardName}, {districtName}, {provinceName}
                                </p>
                            </div>
                            <Divider />
                            <Title level={5}>Ghi chú:</Title>
                            {order.note && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {order.note}
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Payment + summary */}
                    <Card className="p-4 space-y-3">
                        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                            Thanh toán & tổng kết
                        </h2>

                        <div className="flex items-center justify-between text-sm">
                            <span>Trạng thái thanh toán</span>
                            <span className="font-semibold">
                                <Tag color={statusPaymentColor}
                                    className="text-sm px-3 py-1 rounded-full"
                                >
                                    {order.payment_status === "paid" ||
                                        order.payment_status === "success"
                                        ? "Đã thanh toán"
                                        : order.payment_status === "failed"
                                            ? "Thanh toán thất bại"
                                            : "Chờ thanh toán"}
                                </Tag>
                            </span>
                        </div>

                        <div className="border-t border-border my-2" />

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Tạm tính</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Giảm giá</span>
                                <span className="text-green-600">
                                    -{formatPrice(order.discount_amount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí vận chuyển</span>
                                <span>{formatPrice(order.shipping_fee)}</span>
                            </div>
                        </div>

                        <div className="border-t border-border pt-2 mt-1 flex justify-between items-center">
                            <span className="text-sm font-semibold">Tổng thanh toán</span>
                            <span className="text-lg font-bold text-red-500">
                                {formatPrice(order.total_amount)}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Items */}
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                            Sản phẩm ({items.length})
                        </h2>
                    </div>

                    <div className="divide-y divide-border">
                        {items.map((it: any) => (
                            <div
                                key={it._id}
                                className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">{it.name}</p>
                                    {it.attributes && (
                                        <p className="text-xs text-muted-foreground">
                                            {[
                                                it.attributes.frame_shape,
                                                it.attributes.frame_color,
                                                it.attributes.lens_width &&
                                                `Lens ${it.attributes.lens_width}mm`,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Số lượng: {it.quantity}
                                    </p>
                                </div>

                                <div className="text-right mt-2 md:mt-0">
                                    <p className="text-xs text-muted-foreground">
                                        {formatPrice(it.unit_price)} x {it.quantity}
                                    </p>
                                    <p className="font-semibold text-primary">
                                        {formatPrice(it.total)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OrderDetail;
