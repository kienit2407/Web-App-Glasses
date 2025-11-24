/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API } from "@/app/lib/axios-client";
import {
    Card,
    Descriptions,
    Tag,
    Table,
    Space,
    Typography,
    Divider,
    message,
    Button,
    Col,
    Row,
    Breadcrumb
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Spinner } from "@/components/ui/spinner";
import {
    ShoppingCart,
    DollarSign,
    User,
    MapPin,
    ArrowLeft,
} from "lucide-react";

const { Title, Text } = Typography;

type AdminOrderStatus =
    | "pending"
    | "processing"
    | "shipping"
    | "delivering"
    | "delivered"
    | "cancelled"
    | "returned";
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
interface OrderItemRow {
    _id: string;
    product_id: string;
    variant_id: string;
    sku?: string | null;
    name: string;
    attributes?: any;
    unit_price: number;
    quantity: number;
    total: number;
}

interface AdminOrderDetail {
    _id: string;
    order_number: string;
    order_status: AdminOrderStatus;
    payment_status: string;
    payment_method?: "cod" | "vnpay" | string;
    subtotal: number;
    discount_amount: number;
    shipping_fee: number;
    total_amount: number;
    note?: string | null;
    createdAt: string;
    updatedAt: string;
    cancel_requested?: boolean;
    return_requested?: boolean;

    user?: {
        display_name?: string;
        email?: string;
        phone?: string;
    };
    shipping_address?: {
        recipient_name?: string;
        phone?: string;
        // code từ DB
        province_code?: string;
        district_code?: string;
        ward_code?: string;
        // tên sau khi map (nếu sau này bạn muốn lưu riêng)
        province?: string;
        district?: string;
        ward?: string;
        specific_address?: string;
    };
}

interface DetailResponse {
    order: AdminOrderDetail;
    items: OrderItemRow[];
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
});

const AdminOrderDetail = () => {
    const { id, order_num } = useParams<{ id: string, order_num: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<DetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);


    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await API.get(`/admin/orders/${id}`);
            const raw = res.data?.data as any;

            const o = raw.order;

            const mapped: DetailResponse = {
                order: {
                    _id: o._id,
                    order_number: o.order_number,
                    order_status: o.order_status,
                    payment_status: o.payment_status,
                    payment_method: o.payment_method, // nếu BE có field này
                    subtotal: o.subtotal,
                    discount_amount: o.discount_amount,
                    shipping_fee: o.shipping_fee,
                    total_amount: o.total_amount,
                    note: o.note,
                    createdAt: o.createdAt,
                    updatedAt: o.updatedAt,
                    cancel_requested: o.cancel_requested,
                    return_requested: o.return_requested,

                    user: o.user_id
                        ? {
                            display_name: o.user_id.display_name,
                            email: o.user_id.email,

                            phone: o.user_id.phone,
                        }
                        : undefined,
                    shipping_address: o.shipping_address
                        ? {
                            recipient_name: o.shipping_address.recipient_name,
                            phone: o.shipping_address.phone,
                            specific_address: o.shipping_address.specific_address,

                            province_code: o.shipping_address.province_code,
                            district_code: o.shipping_address.district_code,
                            ward_code: o.shipping_address.ward_code,

                            province: o.shipping_address.province_code,
                            district: o.shipping_address.district_code,
                            ward: o.shipping_address.ward_code,
                        }
                        : undefined,
                },
                items: raw.items as OrderItemRow[],
            };

            setData(mapped);
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Không tải được chi tiết đơn hàng"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    useEffect(() => {
        if (!data?.order?.shipping_address) return;

        const { province_code, district_code } = data.order.shipping_address as any;

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
    const renderStatusTag = (status: AdminOrderStatus) => {
        switch (status) {
            case "pending":
                return <Tag color="orange">Chờ xác nhận</Tag>;
            case "processing":
                return <Tag color="blue">Đang xử lý</Tag>;
            case "shipping":
                return <Tag color="blue">Vận chuyển</Tag>;
            case "delivering":
                return <Tag color="gold">Chờ giao</Tag>;
            case "delivered":
                return <Tag color="green">Hoàn thành</Tag>;
            case "cancelled":
                return <Tag>Đã huỷ</Tag>;
            case "returned":
                return <Tag>Đã trả hàng</Tag>;
            default:
                return <Tag>Khác</Tag>;
        }
    };

    const renderPaymentStatus = (status: string) => {
        switch (status) {
            case "success":
                return <Tag color="green">Đã thanh toán</Tag>;
            case "pending":
                return <Tag color="orange">Chờ thanh toán</Tag>;
            case "failed":
                return <Tag color="red">Thanh toán lỗi</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const renderPaymentMethod = (method?: string) => {
        if (!method) return "-";
        if (method === "cod") return "Thanh toán khi nhận hàng (COD)";
        if (method === "vnpay") return "Thanh toán VNPay";
        return method;
    };

    const columns: ColumnsType<OrderItemRow> = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-medium">{record.name}</span>
                    {record.attributes && (
                        <span className="text-xs text-slate-500">
                            {Object.entries(record.attributes)
                                .map(([k, v]) => `${k}: ${String(v)}`)
                                .join(" • ")}
                        </span>
                    )}
                    {record.sku && (
                        <span className="text-xs text-slate-400">SKU: {record.sku}</span>
                    )}
                </div>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "unit_price",
            key: "unit_price",
            width: 120,
            render: (v: number) => currencyFormatter.format(v),
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            key: "quantity",
            width: 90,
        },
        {
            title: "Thành tiền",
            dataIndex: "total",
            key: "total",
            width: 140,
            render: (v: number) => (
                <span className="font-semibold text-red-500">
                    {currencyFormatter.format(v)}
                </span>
            ),
        },
    ];

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
            </div>
        );
    }

    const { order, items } = data;
    const addr = order.shipping_address || {};
    const provinceName =
        provinces.find((p) => p.code === addr.province_code)?.name ??
        addr.province_code;

    const districtName =
        districts.find((d) => d.code === addr.district_code)?.name ??
        addr.district_code;

    const wardName =
        wards.find((w) => w.code === addr.ward_code)?.name ??
        addr.ward_code;
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Button
                        variant="filled"
                        color="blue"
                        onClick={() => navigate("/admin/orders")}
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </Button>
                    <div>
                        <Title level={4} className="!mb-0">
                            Đơn hàng #<Text copyable className="font-medium text-xl text-blue-500">{order.order_number}</Text>
                        </Title>
                        <Text type="secondary">
                            Tạo lúc{" "}
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </Text>
                    </div>
                </div>
                <Space>
                    {renderStatusTag(order.order_status)}
                    {renderPaymentStatus(order.payment_status)}
                </Space>
            </div>
            <Breadcrumb
                className="my-5 [&_a]:text-blue-600"
                items={[
                    { title: <Link to="/admin/orders" className="hover:text-blue text-black">Quản lý đơn hàng</Link> },
                    { title: "Chi tiết đơn hàng" },
                ]}

            />
            {/* Thông tin tổng quan */}
            <Card>
                <Descriptions
                    title={
                        <span className="flex items-center gap-2">
                            <ShoppingCart size={18} />
                            Thông tin đơn hàng
                        </span>
                    }
                    column={3}
                    bordered
                    size="small"
                >
                    <Descriptions.Item label="Mã đơn">
                        {order.order_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {renderStatusTag(order.order_status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thanh toán">
                        {renderPaymentStatus(order.payment_status)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Phương thức thanh toán">
                        {renderPaymentMethod(order.payment_method)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Yêu cầu huỷ">
                        {order.cancel_requested ? (
                            <Tag color="red">Có yêu cầu huỷ</Tag>
                        ) : (
                            <Tag>Không</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Yêu cầu trả hàng">
                        {order.return_requested ? (
                            <Tag color="purple">Có yêu cầu trả</Tag>
                        ) : (
                            <Tag>Không</Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ghi chú" span={3}>
                        {order.note || "-"}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Khách hàng & địa chỉ */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Card>
                        <Descriptions
                            title={
                                <span className="flex items-center gap-2">
                                    <User size={18} />
                                    Khách hàng
                                </span>
                            }
                            column={1}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Họ tên">
                                {order.user?.display_name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {order.user?.email || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {order.user?.phone || addr.phone || "-"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card>
                        <Descriptions
                            title={
                                <span className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    Địa chỉ giao hàng
                                </span>
                            }
                            column={1}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Người nhận">
                                {addr.recipient_name || "-"}{" "}
                                {addr.phone && <span>({addr.phone})</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ chi tiết">
                                {addr.specific_address || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khu vực">
                                {[wardName, districtName, provinceName]
                                    .filter(Boolean)
                                    .join(", ") || "-"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            {/* Sản phẩm */}
            <Card
                title="Sản phẩm trong đơn"
                extra={
                    <Text type="secondary">
                        Tổng {items.length} dòng sản phẩm
                    </Text>
                }
            >
                <Table<OrderItemRow>
                    dataSource={items}
                    columns={columns}
                    rowKey={(r) => r._id}
                    pagination={false}
                    size="small"
                />
            </Card>

            {/* Tổng tiền */}
            <Card>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex justify-between w-full max-w-md">
                        <Text>Tổng tiền hàng</Text>
                        <Text>
                            {currencyFormatter.format(order.subtotal || 0)}
                        </Text>
                    </div>
                    <div className="flex justify-between w-full max-w-md">
                        <Text>Giảm giá</Text>
                        <Text type="success">
                            -{currencyFormatter.format(order.discount_amount || 0)}
                        </Text>
                    </div>
                    <div className="flex justify-between w-full max-w-md">
                        <Text>Phí vận chuyển</Text>
                        <Text>
                            {currencyFormatter.format(order.shipping_fee || 0)}
                        </Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div className="flex justify-between w-full max-w-md">
                        <Text strong>Tổng thanh toán</Text>
                        <Text strong className="text-lg text-red-500">
                            {currencyFormatter.format(order.total_amount || 0)}
                        </Text>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminOrderDetail;
