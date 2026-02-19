/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/coupons/AdminCouponPage.tsx
import { useEffect, useMemo, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
    Table,
    Tag,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    DatePicker,
    Switch,
    Popconfirm,
    message,
    Tabs,
    List,
    Pagination,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TabsProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { PlusOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

type TCouponType = "percent" | "fixed";

interface Coupon {
    _id: string;
    code: string;
    type: TCouponType;
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    start_date: string;
    end_date?: string | null;
    is_active: boolean;
    createdAt: string;

    used_count?: number;
    saved_count?: number;
    user_count?: number;
}

interface ListResponse {
    items: Coupon[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

type ActiveTab = "active" | "inactive" | "all";

interface FilterState {
    code?: string;
    type?: TCouponType | "all";
}

interface FormValues {
    code: string;
    type: TCouponType;
    value: number;
    max_discount?: number | null;
    min_order?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    start_date: Dayjs;
    end_date?: Dayjs | null;
    is_active?: boolean;
}

const AdminCouponPage = () => {
    const isMobile = useIsMobile();

    const [data, setData] = useState<Coupon[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [filters, setFilters] = useState<FilterState>({ type: "all" });
    const [activeTab, setActiveTab] = useState<ActiveTab>("all");
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [form] = Form.useForm<FormValues>();

    // action sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<Coupon | null>(null);

    const fetchCoupons = async (opts?: { page?: number; limit?: number }) => {
        setLoading(true);
        try {
            const currentPage = opts?.page ?? page;
            const currentLimit = opts?.limit ?? limit;

            const params: any = { page: currentPage, limit: currentLimit };

            if (filters.code) params.code = filters.code;
            if (filters.type && filters.type !== "all") params.type = filters.type;

            if (activeTab === "active") params.is_active = 1;
            else if (activeTab === "inactive") params.is_active = 0;

            const res = await API.get("/admin/coupons", { params });
            const payload = res.data?.data as ListResponse;

            setData(payload.items);
            setPage(payload.pagination.page);
            setLimit(payload.pagination.limit);
            setTotal(payload.pagination.total);
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không tải được danh sách coupon");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchCoupons({ page: 1, limit });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, activeTab]);

    const openCreateModal = () => {
        setEditingCoupon(null);
        form.resetFields();
        form.setFieldsValue({ type: "percent", is_active: true } as any);
        setModalVisible(true);
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        form.setFieldsValue({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount: coupon.max_discount ?? null,
            min_order: coupon.min_order ?? null,
            usage_limit: coupon.usage_limit ?? null,
            per_user_limit: coupon.per_user_limit ?? null,
            start_date: dayjs(coupon.start_date),
            end_date: coupon.end_date ? dayjs(coupon.end_date) : null,
            is_active: coupon.is_active,
        } as any);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                start_date: values.start_date.toISOString(),
                end_date: values.end_date ? values.end_date.toISOString() : null,
            };

            if (editingCoupon) {
                await API.patch(`/admin/coupons/${editingCoupon._id}`, payload);
                message.success("Cập nhật coupon thành công");
            } else {
                await API.post("/admin/coupons", payload);
                message.success("Tạo coupon thành công");
            }

            setModalVisible(false);
            fetchCoupons();
        } catch (err: any) {
            if (err?.errorFields) return;
            console.error(err);
            message.error(err?.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleSoftDelete = async (id: string) => {
        try {
            await API.delete(`/admin/coupons/${id}`);
            message.success("Đã vô hiệu hoá coupon");
            setSheetOpen(false);
            fetchCoupons();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không vô hiệu được coupon");
        }
    };

    const handleHardDelete = async (id: string) => {
        try {
            await API.delete(`/admin/coupons/${id}`, { params: { force: "true" } });
            message.success("Đã xoá vĩnh viễn coupon");
            setSheetOpen(false);
            fetchCoupons();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không xoá được coupon");
        }
    };

    const columns: ColumnsType<Coupon> = useMemo(
        () => [
            {
                title: "Mã",
                dataIndex: "code",
                key: "code",
                render: (code: string) => (
                    <Tag color="orange" className="font-semibold">
                        {code}
                    </Tag>
                ),
            },
            {
                title: "Loại",
                dataIndex: "type",
                key: "type",
                render: (type: TCouponType) =>
                    type === "percent" ? <Tag color="blue">Phần trăm</Tag> : <Tag color="geekblue">Cố định</Tag>,
            },
            {
                title: "Giá trị",
                dataIndex: "value",
                key: "value",
                render: (value: number, record) =>
                    record.type === "percent" ? `${value}%` : `${value.toLocaleString("vi-VN")} đ`,
            },
            {
                title: "Hiệu lực",
                key: "date",
                render: (_, record) => (
                    <div className="text-xs">
                        <div>Từ: {dayjs(record.start_date).format("DD/MM/YYYY")}</div>
                        <div>
                            Đến: {record.end_date ? dayjs(record.end_date).format("DD/MM/YYYY") : "Không giới hạn"}
                        </div>
                    </div>
                ),
            },
            {
                title: "Lượt sử dụng",
                key: "usage",
                render: (_, record) => {
                    const used = record.used_count ?? 0;
                    const lim = record.usage_limit ?? null;
                    const users = record.user_count ?? 0;
                    return (
                        <div className="text-xs">
                            <div>
                                Đã dùng: {used}
                                {lim != null ? ` / ${lim}` : ""}
                            </div>
                            <div>Người dùng: {users}</div>
                        </div>
                    );
                },
            },
            {
                title: "Trạng thái",
                dataIndex: "is_active",
                key: "is_active",
                render: (is_active: boolean) =>
                    is_active ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Đã tắt</Tag>,
            },
            {
                title: "Thao tác",
                key: "actions",
                render: (_, record) => (
                    <Space>
                        <Button
                            size="middle"
                            variant="filled"
                            color="blue"
                            type="link"
                            onClick={() => openEditModal(record)}
                        >
                            Sửa
                        </Button>

                        {record.is_active ? (
                            <Popconfirm
                                trigger={"click"}
                                title="Vô hiệu hoá coupon này?"
                                description="Coupon sẽ được tắt."
                                okText="Đồng ý"
                                cancelText="Huỷ"
                                onConfirm={() => handleSoftDelete(record._id)}
                            >
                                <Button size="middle" type="link" variant="filled" color="danger">
                                    Tạm dừng
                                </Button>
                            </Popconfirm>
                        ) : (
                            <Popconfirm
                                title="Xoá vĩnh viễn coupon này?"
                                description="Hành động này sẽ xoá coupon và các bản ghi liên quan. Bạn chắc chứ?"
                                okText="Xoá"
                                cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleHardDelete(record._id)}
                            >
                                <Button size="small" type="link" danger>
                                    Xoá vĩnh viễn
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                ),
            },
        ],
        []
    );

    const tabItems: TabsProps["items"] = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang hoạt động" },
        { key: "inactive", label: "Đã tắt" },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Quản lý Coupon</h2>
                    <p className="text-xs text-slate-500">Tạo, chỉnh sửa và quản lý các mã giảm giá.</p>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className={isMobile ? "w-full" : ""}
                    onClick={openCreateModal}
                >
                    Tạo coupon
                </Button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow p-4">
                <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(k) => {
                        setActiveTab(k as ActiveTab);
                        setPage(1);
                    }}
                />
            </div>

            {/* Filters */}
            <div className="rounded-lg border bg-white p-3">
                <div className={`flex ${isMobile ? "flex-col" : "items-end"} gap-3 flex-wrap`}>
                    <div className={isMobile ? "w-full" : ""}>
                        <div className="text-xs mb-1 font-medium text-slate-600">Mã coupon</div>
                        <Input
                            placeholder="Nhập mã..."
                            allowClear
                            style={{ width: isMobile ? "100%" : 180 }}
                            value={filters.code}
                            onChange={(e) =>
                                setFilters((f) => ({ ...f, code: e.target.value || undefined }))
                            }
                        />
                    </div>

                    <div className={isMobile ? "w-full" : ""}>
                        <div className="text-xs mb-1 font-medium text-slate-600">Loại</div>
                        <Select
                            style={{ width: isMobile ? "100%" : 160 }}
                            value={filters.type}
                            onChange={(val) => setFilters((f) => ({ ...f, type: val as any }))}
                            options={[
                                { label: "Tất cả", value: "all" },
                                { label: "Phần trăm", value: "percent" },
                                { label: "Cố định", value: "fixed" },
                            ]}
                        />
                    </div>

                    <div className={`flex gap-2 ${isMobile ? "w-full" : ""}`}>
                        <Button
                            onClick={() => fetchCoupons()}
                            disabled={loading}
                            className={isMobile ? "w-full" : ""}
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-lg border bg-white p-3">
                {isMobile ? (
                    <>
                        <List
                            loading={loading}
                            dataSource={data}
                            renderItem={(item) => {
                                const valueText =
                                    item.type === "percent"
                                        ? `${item.value}%`
                                        : `${item.value.toLocaleString("vi-VN")} đ`;

                                return (
                                    <List.Item className="!px-0">
                                        <div className="w-full rounded-lg border bg-white p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Tag color="orange" className="font-semibold">
                                                            {item.code}
                                                        </Tag>
                                                        {item.type === "percent" ? (
                                                            <Tag color="blue">%</Tag>
                                                        ) : (
                                                            <Tag color="geekblue">VNĐ</Tag>
                                                        )}
                                                        {item.is_active ? (
                                                            <Tag color="green">Đang hoạt động</Tag>
                                                        ) : (
                                                            <Tag color="red">Đã tắt</Tag>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-600">
                                                        Giá trị: <b>{valueText}</b>
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {dayjs(item.start_date).format("DD/MM/YYYY")} →{" "}
                                                        {item.end_date ? dayjs(item.end_date).format("DD/MM/YYYY") : "Không giới hạn"}
                                                    </div>

                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Đã dùng: <b>{item.used_count ?? 0}</b>
                                                        {item.usage_limit != null ? ` / ${item.usage_limit}` : ""}{" "}
                                                        · Người dùng: <b>{item.user_count ?? 0}</b>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="text"
                                                    onClick={() => {
                                                        setSheetItem(item);
                                                        setSheetOpen(true);
                                                    }}
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />

                        <div className="pt-3 flex justify-end">
                            <Pagination
                                current={page}
                                pageSize={limit}
                                total={total}
                                showSizeChanger={false}
                                onChange={(p) => {
                                    setPage(p);
                                    fetchCoupons({ page: p });
                                }}
                            />
                        </div>

                        <MobileActionSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            title={<span className="font-semibold">{sheetItem?.code}</span>}
                        >
                            <div className="space-y-2">
                                <Button
                                    block
                                    onClick={() => {
                                        if (!sheetItem) return;
                                        openEditModal(sheetItem);
                                        setSheetOpen(false);
                                    }}
                                >
                                    Sửa
                                </Button>

                                {sheetItem?.is_active ? (
                                    <Popconfirm
                                        title="Vô hiệu hoá coupon này?"
                                        description="Coupon sẽ được tắt."
                                        okText="Đồng ý"
                                        cancelText="Huỷ"
                                        onConfirm={() => sheetItem?._id && handleSoftDelete(sheetItem._id)}
                                    >
                                        <Button block danger>
                                            Tạm dừng
                                        </Button>
                                    </Popconfirm>
                                ) : (
                                    <Popconfirm
                                        title="Xoá vĩnh viễn coupon này?"
                                        description="Hành động này sẽ xoá coupon và các bản ghi liên quan. Bạn chắc chứ?"
                                        okText="Xoá"
                                        cancelText="Huỷ"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => sheetItem?._id && handleHardDelete(sheetItem._id)}
                                    >
                                        <Button block danger>
                                            Xoá vĩnh viễn
                                        </Button>
                                    </Popconfirm>
                                )}
                            </div>
                        </MobileActionSheet>
                    </>
                ) : (
                    <Table<Coupon>
                        rowKey="_id"
                        loading={loading}
                        columns={columns}
                        dataSource={data}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total,
                            onChange: (p, l) => {
                                setPage(p);
                                setLimit(l || 10);
                                fetchCoupons({ page: p, limit: l || 10 });
                            },
                        }}
                    />
                )}
            </div>

            {/* Modal create / edit (giữ nguyên) */}
            <Modal
                title={editingCoupon ? "Chỉnh sửa coupon" : "Tạo coupon mới"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
                okText={editingCoupon ? "Cập nhật" : "Tạo mới"}
                destroyOnClose={false}
            >
                <Form<FormValues>
                    form={form}
                    layout="vertical"
                    initialValues={{ type: "percent", is_active: true }}
                >
                    <Form.Item
                        label="Mã coupon"
                        name="code"
                        rules={[{ required: true, message: "Vui lòng nhập mã coupon" }]}
                    >
                        <Input placeholder="VD: SALE10" />
                    </Form.Item>

                    <Form.Item
                        label="Loại"
                        name="type"
                        rules={[{ required: true, message: "Vui lòng chọn loại" }]}
                    >
                        <Select
                            options={[
                                { label: "Phần trăm (%)", value: "percent" },
                                { label: "Cố định (VNĐ)", value: "fixed" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Giá trị"
                        name="value"
                        rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
                    >
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="10 hoặc 50000" />
                    </Form.Item>

                    <Form.Item label="Giảm tối đa (VNĐ)" name="max_discount">
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Không nhập = không giới hạn" />
                    </Form.Item>

                    <Form.Item label="Đơn tối thiểu (VNĐ)" name="min_order">
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Không nhập = không giới hạn" />
                    </Form.Item>

                    <Form.Item label="Giới hạn tổng số lượt dùng" name="usage_limit">
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Không nhập = không giới hạn" />
                    </Form.Item>

                    <Form.Item label="Giới hạn mỗi user" name="per_user_limit">
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Không nhập = không giới hạn" />
                    </Form.Item>

                    <Form.Item
                        label="Ngày bắt đầu"
                        name="start_date"
                        rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
                    >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item label="Ngày kết thúc" name="end_date">
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear />
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="is_active" valuePropName="checked">
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCouponPage;
