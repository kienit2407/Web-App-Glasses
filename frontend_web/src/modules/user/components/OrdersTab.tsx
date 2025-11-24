/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Tabs, Button, Tag, Typography, Empty, message, Pagination } from "antd"
import { API } from "@/app/lib/axios-client"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNavigate } from "react-router-dom"
import Paragraph from "antd/es/typography/Paragraph"

const { Title, Text } = Typography

const ORDER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "processing", label: "Đang xử lý" },
    { key: "shipping", label: "Vận chuyển" },
    { key: "delivering", label: "Chờ giao hàng" },
    { key: "delivered", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã huỷ" },
    { key: "cancel_requested", label: "Yêu cầu huỷ" },
    { key: "return_requested", label: "Yêu cầu trả hàng" },
    { key: "returned", label: "Đã trả hàng" },
]

interface OrderItem {
    product_id: string
    slug: string
    product_name: string
    thumbnail_url: string
    variant_name?: string
    quantity: number
    price: number
}

interface OrderRow {
    _id: string
    code: string
    shop_name: string
    status: string
    cancel_requested?: boolean
    return_requested?: boolean
    items: OrderItem[]
    total_amount: number
    created_at: string
}

export const OrdersTab = () => {
    const [activeStatus, setActiveStatus] = useState("all")
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState(false)
    const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null)
    const [reorderLoadingId, setReorderLoadingId] = useState<string | null>(null)
    const [confirmLoadingId, setConfirmLoadingId] = useState<string | null>(null)
    const [returnLoadingId, setReturnLoadingId] = useState<string | null>(null)

    const isMobile = useIsMobile()
    const navigate = useNavigate()

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [total, setTotal] = useState(0);
    const fetchOrders = async (status: string, pageArg = page, limitArg = pageSize) => {
        setLoading(true);
        try {
            const res = await API.get("/orders", {
                params:
                    status === "all"
                        ? { page: pageArg, limit: limitArg }
                        : { status, page: pageArg, limit: limitArg },
            });
            const data = res.data?.data;
            setOrders(Array.isArray(data?.items) ? data.items : []);

            if (data?.pagination) {
                setPage(data.pagination.page || pageArg);
                setPageSize(data.pagination.limit || limitArg);
                setTotal(data.pagination.total || 0);
            }
        } catch (err) {
            console.error(err);
            setOrders([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // mỗi lần đổi tab, luôn quay về trang 1
        fetchOrders(activeStatus, 1, pageSize)
        setPage(1);
    }, [activeStatus, pageSize])
    const handlePageChange = (p: number, size: number) => {
        setPage(p);
        setPageSize(size);
        fetchOrders(activeStatus, p, size);
    };
    const handleConfirmDelivered = async (order: OrderRow) => {
        try {
            setConfirmLoadingId(order._id)
            await API.patch(`/orders/${order._id}/confirm-delivered`)
            message.success("Đã xác nhận nhận hàng")
            fetchOrders(activeStatus)
        } catch (err: any) {
            console.error(err)
            const msg =
                err?.response?.data?.message || "Không thể xác nhận nhận hàng"
            message.error(msg)
        } finally {
            setConfirmLoadingId(null)
        }
    }

    const handleRequestReturn = async (order: OrderRow) => {
        try {
            setReturnLoadingId(order._id)
            await API.patch(`/orders/${order._id}/request-return`)
            message.success("Đã gửi yêu cầu trả hàng")
            fetchOrders(activeStatus)
        } catch (err: any) {
            console.error(err)
            const msg =
                err?.response?.data?.message || "Không thể gửi yêu cầu trả hàng"
            message.error(msg)
        } finally {
            setReturnLoadingId(null)
        }
    }

    const handleRequestCancel = async (order: OrderRow) => {
        try {
            setCancelLoadingId(order._id)
            await API.patch(`/orders/${order._id}/cancel`)
            message.success("Đã gửi yêu cầu huỷ đơn hàng")
            fetchOrders(activeStatus)
        } catch (err: any) {
            console.error(err)
            const msg =
                err?.response?.data?.message || "Không thể gửi yêu cầu huỷ đơn"
            message.error(msg)
        } finally {
            setCancelLoadingId(null)
        }
    }

    const handleReorder = async (order: OrderRow) => {
        try {
            setReorderLoadingId(order._id)
            await API.post(`/orders/${order._id}/reorder`)
            message.success("Đã thêm sản phẩm vào giỏ hàng")
            navigate("/cart")
        } catch (err: any) {
            console.error(err)
            const msg =
                err?.response?.data?.message || "Không thể mua lại đơn hàng"
            message.error(msg)
        } finally {
            setReorderLoadingId(null)
        }
    }

    const renderStatusTag = (
        status: string,
        cancelRequested?: boolean,
        returnRequested?: boolean
    ) => {
        if (cancelRequested && status !== "cancelled") {
            return <Tag color="red">Chờ duyệt huỷ</Tag>
        }
        if (returnRequested && status === "delivered") {
            return <Tag color="purple">Chờ duyệt trả hàng</Tag>
        }

        switch (status) {
            case "pending":
                return <Tag color="orange">Chờ xác nhận</Tag>
            case "processing":
                return <Tag color="blue">Đang xử lý</Tag>
            case "shipping":
                return <Tag color="blue">Đang vận chuyển</Tag>
            case "delivering":
                return <Tag color="gold">Chờ giao hàng</Tag>
            case "delivered":
                return <Tag color="green">Hoàn thành</Tag>
            case "cancelled":
                return <Tag color="cyan">Đã huỷ</Tag>
            case "returned":
                return <Tag color="volcano">Đã trả hàng</Tag>
            default:
                return <Tag>Khác</Tag>
        }
    }

    // Quy tắc:
    // - Luôn có nút "Xem chi tiết"
    // - pending / processing / shipping: thêm "Yêu cầu huỷ đơn"
    // - delivering: "Đã nhận được hàng"
    // - delivered: xem chi tiết + mua lại + (ở item riêng sẽ có "Viết đánh giá")
    // - cancelled / returned: chỉ xem chi tiết
    const renderActions = (order: OrderRow) => {
        const isCancelLoading = cancelLoadingId === order._id
        const isReorderLoading = reorderLoadingId === order._id
        const isConfirmLoading = confirmLoadingId === order._id
        const isReturnLoading = returnLoadingId === order._id

        const baseDetailBtn = (
            <Button
                size={isMobile ? "small" : "middle"}
                onClick={() => navigate(`/orders/${order._id}/${order.code}`)}
            >
                Xem chi tiết
            </Button>
        )

        if (order.status === "cancelled" || order.status === "returned") {
            return <>{baseDetailBtn}</>
        }

        if (["pending", "processing", "shipping"].includes(order.status)) {
            return (
                <>
                    {baseDetailBtn}
                    {order.cancel_requested ? (
                        <Button disabled size={isMobile ? "small" : "middle"}>
                            Đang chờ duyệt huỷ
                        </Button>
                    ) : (
                        <Button
                            danger
                            size={isMobile ? "small" : "middle"}
                            loading={isCancelLoading}
                            onClick={() => handleRequestCancel(order)}
                        >
                            Yêu cầu huỷ đơn
                        </Button>
                    )}
                </>
            )
        }

        if (order.status === "delivering") {
            return (
                <>
                    {baseDetailBtn}
                    <Button
                        type="primary"
                        size={isMobile ? "small" : "middle"}
                        loading={isConfirmLoading}
                        onClick={() => handleConfirmDelivered(order)}
                    >
                        Đã nhận được hàng
                    </Button>
                </>
            )
        }

        if (order.status === "delivered") {
            return (
                <>
                    {baseDetailBtn}
                    <Button
                        type="primary"
                        ghost
                        size={isMobile ? "small" : "middle"}
                        loading={isReorderLoading}
                        onClick={() => handleReorder(order)}
                    >
                        Mua lại
                    </Button>
                    {order.return_requested ? (
                        <Button disabled size={isMobile ? "small" : "middle"}>
                            Đang chờ duyệt trả
                        </Button>
                    ) : (
                        <Button
                            size={isMobile ? "small" : "middle"}
                            loading={isReturnLoading}
                            onClick={() => handleRequestReturn(order)}
                        >
                            Yêu cầu trả hàng
                        </Button>
                    )}
                </>
            )
        }

        return <>{baseDetailBtn}</>
    }

    return (
        <div>
            <Title level={4}>Đơn mua</Title>

            <Tabs
                activeKey={activeStatus}
                onChange={(k) => setActiveStatus(k)}
                tabBarGutter={isMobile ? 8 : 24}
                size={isMobile ? "small" : "middle"}
                className="mt-4"
            >
                {ORDER_TABS.map((tab) => (
                    <Tabs.TabPane tab={tab.label} key={tab.key} />
                ))}
            </Tabs>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : orders.length === 0 ? (
                <div className="py-10">
                    <Empty description="Chưa có đơn hàng nào" />
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="border border-border rounded-lg bg-white overflow-hidden"
                        >
                            {/* header */}
                            <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{order.shop_name}</span>
                                    <Tag color={"geekblue"}>
                                        Đơn #<Text copyable>{order.code}</Text>
                                    </Tag>
                                </div>
                                <div className="flex items-center gap-2 justify-between md:justify-end">
                                    <Text type="secondary" className="text-xs md:text-sm">
                                        Ngày đặt:{" "}
                                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </Text>
                                    {renderStatusTag(
                                        order.status,
                                        order.cancel_requested,
                                        order.return_requested
                                    )}
                                </div>
                            </div>

                            {/* body: items */}
                            {order.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="px-4 py-3 flex gap-3 border-b last:border-b-0"
                                >
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.product_name}
                                        className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center">
                                        <div className="flex-1">
                                            <div className="font-medium line-clamp-2">
                                                {item.product_name}
                                            </div>
                                            {item.variant_name && (
                                                <div className="text-xs text-muted-foreground">
                                                    Phân loại: {item.variant_name}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                x{item.quantity}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                            <div className="text-base font-semibold text-red-500">
                                                {item.price.toLocaleString("vi-VN")}₫
                                            </div>

                                            {/* Nút viết đánh giá – chỉ khi đơn đã hoàn thành */}
                                            {order.status === "delivered" && item.product_id && (
                                                <Button
                                                    size={isMobile ? "small" : "middle"}
                                                    onClick={() =>
                                                        navigate(
                                                            `/products/${item.slug}/${item.product_id}`
                                                        )
                                                    }
                                                >
                                                    Viết đánh giá
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* footer */}
                            <div className="px-4 py-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-t bg-muted/40">
                                <div className="text-sm text-muted-foreground">
                                    Thành tiền:{" "}
                                    <span className="text-lg font-semibold text-red-500">
                                        {order.total_amount.toLocaleString("vi-VN")}₫
                                    </span>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    {renderActions(order)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-end mt-4">
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    pageSizeOptions={["5", "10", "20"]}
                    onChange={handlePageChange}
                />
            </div>
        </div>
    )
}
