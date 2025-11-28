/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
    Button,
    Input,
    Space,
    Table,
    Tag,
    Tabs,
    Badge,
    message,
} from "antd";
import type { TableProps, TabsProps } from "antd";
import { useNavigate } from "react-router-dom";

type AdminOrderStatus =
    | "pending"
    | "processing"
    | "shipping"
    | "delivering"
    | "delivered"
    | "cancelled"
    | "returned";

interface AdminOrderRow {
    _id: string;
    order_number: string;
    user_name: string;
    user_email: string;
    order_status: AdminOrderStatus;
    payment_status: string;
    total_amount: number;
    createdAt: string;
    cancel_requested?: boolean;
    return_requested?: boolean;
}

interface ListResponse {
    items: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const STATUS_TABS: { key: string; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "processing", label: "Đang xử lý" },
    { key: "shipping", label: "Vận chuyển" },
    { key: "delivering", label: "Chờ giao" },
    { key: "delivered", label: "Hoàn thành" },
    { key: "cancel_requested", label: "Yêu cầu huỷ" },
    { key: "return_requested", label: "Yêu cầu trả hàng" },
    { key: "returned", label: "Đã trả hàng" },
    { key: "cancelled", label: "Đã huỷ" },
];

const AdminOrders = () => {
    const [orders, setOrders] = useState<AdminOrderRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeStatus, setActiveStatus] = useState<string>("all");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const navigate = useNavigate();

    const fetchOrders = async (opts?: {
        status?: string;
        q?: string;
        page?: number;
        limit?: number;
    }) => {
        const currentStatus = opts?.status ?? activeStatus;
        const currentQ = opts?.q ?? q;
        const currentPage = opts?.page ?? page;
        const currentLimit = opts?.limit ?? limit;

        setLoading(true);
        try {
            const res = await API.get("/admin/orders", {
                params: {
                    // BE xử lý đặc biệt với "cancel_requested" / "return_requested"
                    order_status: currentStatus === "all" ? undefined : currentStatus,
                    order_number: currentQ || undefined,
                    page: currentPage,
                    limit: currentLimit,
                },
            });

            const data: ListResponse = res.data?.data;
            const items = (data.items || []).map((o: any): AdminOrderRow => ({
                _id: o._id,
                order_number: o.order_number,
                user_name: o.user_id?.display_name || "N/A",
                user_email: o.user_id?.email || "",
                order_status: o.order_status,
                payment_status: o.payment_status,
                total_amount: o.total_amount,
                createdAt: o.createdAt,
                cancel_requested: o.cancel_requested,
                return_requested: o.return_requested,
            }));

            setOrders(items);
            setPage(data.pagination.page);
            setLimit(data.pagination.limit);
            setTotal(data.pagination.total);
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Không tải được danh sách đơn hàng"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders()
        fetchStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStatus]);

    const handleSearch = (value: string) => {
        setQ(value);
        fetchOrders({ q: value, page: 1 });
    };

    const onTabChange = (key: string) => {
        setActiveStatus(key);
        setPage(1);
        fetchOrders({ status: key, page: 1 });
    };

    const renderOrderStatusTag = (
        status: AdminOrderStatus,
        cancelRequested?: boolean,
        returnRequested?: boolean
    ) => {
        // ưu tiên hiển thị theo flag
        if (cancelRequested && status !== "cancelled") {
            return <Tag color="red">Yêu cầu huỷ</Tag>;
        }
        if (returnRequested && status === "delivered") {
            return <Tag color="purple">Yêu cầu trả hàng</Tag>;
        }

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
    const fetchStats = async () => {
        try {
            const res = await API.get("/admin/orders/stats");
            const data = res.data?.data || {};
            setStatusCounts(data);
        } catch (err) {
            console.error(err);
        }
    }
    const handleUpdateStatus = async (
        orderId: string,
        nextStatus: AdminOrderStatus
    ) => {
        try {
            setUpdatingId(orderId);
            await API.patch(`/admin/orders/${orderId}/status`, {
                order_status: nextStatus,
            });
            message.success("Cập nhật trạng thái đơn hàng thành công");
            // fetchOrders();
            await Promise.all([fetchOrders(), fetchStats()]);
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message ||
                "Không thể cập nhật trạng thái đơn hàng"
            )
        } finally {
            setUpdatingId(null);
        }
    };
    const renderTabLabel = (key: string, label: string) => {
        const count = statusCounts[key] ?? 0;
        return (
            <span>
                {label}
                {count > 0 && (
                    <span className="ml-1 text-xs text-slate-500">
                        <Badge count={count} offset={[0, -20]}></Badge>
                    </span>
                )}
            </span>
        );
    };

    const tabItems: TabsProps["items"] = STATUS_TABS.map((t) => ({
        key: t.key,
        label: renderTabLabel(t.key, t.label),
    }));
    const columns: TableProps<AdminOrderRow>["columns"] = [
        {
            title: "Mã đơn",
            dataIndex: "order_number",
            key: "order_number",
            width: "100px",
            render: (text, record) => (
                <Button
                    type="link"
                    onClick={() => navigate(`/admin/orders/${record._id}/${record.order_number}`)}
                >
                    {text}
                </Button>
            ),
        },
        {
            title: "Khách hàng",
            dataIndex: "user_name",
            key: "user_name",
            render: (name, record) => (
                <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-slate-500">{record.user_email}</div>
                </div>
            ),
        },
        {
            title: "Trạng thái đơn",
            dataIndex: "order_status",
            key: "order_status",
            render: (_: any, record) =>
                renderOrderStatusTag(
                    record.order_status,
                    record.cancel_requested,
                    record.return_requested
                ),
        },
        {
            title: "Thanh toán",
            dataIndex: "payment_status",
            key: "payment_status",
            render: (status: string) => {
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
            },
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_amount",
            key: "total_amount",
            render: (value: number) =>
                value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value: string) => {
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return "N/A";
                return d.toLocaleString("vi-VN");
            },
        },
        {
            title: "Hành động",
            key: "action",
            fixed: "right",
            render: (_text, record) => {
                const status = record.order_status;

                const viewBtn = (
                    <Button
                        size="small"
                        onClick={() => navigate(`/admin/orders/${record._id}/${record.order_number}`)}
                    >
                        Chi tiết
                    </Button>
                );


                if (record.return_requested && status === "delivered") {
                    return (
                        <Space>
                            {viewBtn}
                            <Button
                                danger
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() => handleUpdateStatus(record._id, "returned")}
                            >
                                Duyệt trả hàng
                            </Button>
                            <Button
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() =>
                                    handleUpdateStatus(record._id, record.order_status)
                                }
                            >
                                Từ chối trả hàng
                            </Button>
                        </Space>
                    );
                }


                if (record.cancel_requested && status !== "cancelled") {
                    return (
                        <Space>
                            {viewBtn}
                            <Button
                                danger
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() => handleUpdateStatus(record._id, "cancelled")}
                            >
                                Duyệt huỷ
                            </Button>
                            <Button
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() =>
                                    handleUpdateStatus(record._id, record.order_status)
                                }
                            >
                                Từ chối huỷ
                            </Button>
                        </Space>
                    );
                }

                // pending → processing
                if (status === "pending") {
                    return (
                        <Space>
                            {viewBtn}
                            <Button
                                type="primary"
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() =>
                                    handleUpdateStatus(record._id, "processing")
                                }
                            >
                                Xác nhận đơn
                            </Button>
                        </Space>
                    );
                }

                // processing → shipping
                if (status === "processing") {
                    return (
                        <Space>
                            {viewBtn}
                            <Button
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() =>
                                    handleUpdateStatus(record._id, "shipping")
                                }
                            >
                                Bàn giao cho đơn vị vận chuyển
                            </Button>
                        </Space>
                    );
                }

                // shipping → delivering
                if (status === "shipping") {
                    return (
                        <Space>
                            {viewBtn}
                            <Button
                                size="small"
                                loading={updatingId === record._id}
                                onClick={() =>
                                    handleUpdateStatus(record._id, "delivering")
                                }
                            >
                                Bắt đầu giao cho khách
                            </Button>
                        </Space>
                    );
                }

                // các trạng thái khác: chỉ xem chi tiết
                return <Space>{viewBtn}</Space>;
            },
        },
    ];

    // const tabItems: TabsProps["items"] = STATUS_TABS.map((t) => ({
    //     key: t.key,
    //     label: t.label,
    // }));

    return (
        <div className="space-y-2">
            <h2 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h2>

            <div className="bg-white rounded-lg shadow p-4 mb-2">
                <Space>
                    <Input.Search
                        placeholder="Tìm theo mã đơn..."
                        allowClear
                        onSearch={handleSearch}
                        onChange={(e) => {
                            if (!e.target.value) handleSearch("");
                        }}
                        style={{ width: 260 }}
                    />
                </Space>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <Tabs items={tabItems} activeKey={activeStatus} onChange={onTabChange} />

                <Table<AdminOrderRow>
                    loading={loading}
                    columns={columns}
                    dataSource={orders}
                    rowKey={(record) => record._id}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        onChange: (p, l) => {
                            setPage(p);
                            setLimit(l);
                            fetchOrders({ page: p, limit: l });
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default AdminOrders;
