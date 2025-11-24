// src/pages/admin/coupons/AdminCouponPage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { TabsProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { PlusOutlined } from "@ant-design/icons";

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

    // các field thống kê thêm từ BE
    used_count?: number;   // số lượt đã dùng (is_used=true)
    saved_count?: number;  // tổng số user_coupons
    user_count?: number;   // số user khác nhau đã lưu/dùng
}

interface ListResponse {
    items: Coupon[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
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
    const [data, setData] = useState<Coupon[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState<FilterState>({
        type: "all",
    });
    const [activeTab, setActiveTab] = useState<ActiveTab>("active");
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [form] = Form.useForm<FormValues>();

    // ===== Fetch list =====
    const fetchCoupons = async (
        page = pagination.current || 1,
        limit = pagination.pageSize || 10
    ) => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit,
            };

            if (filters.code) params.code = filters.code;
            if (filters.type && filters.type !== "all") params.type = filters.type;

            if (activeTab === "active") params.is_active = 1;
            else if (activeTab === "inactive") params.is_active = 0;

            const res = await API.get("/admin/coupons", { params });
            const payload = res.data?.data as ListResponse;

            setData(payload.items);
            setPagination({
                current: payload.pagination.page,
                pageSize: payload.pagination.limit,
                total: payload.pagination.total,
            });
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Không tải được danh sách coupon"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons(1, pagination.pageSize || 10);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, activeTab]);

    // ===== Table columns =====
    const columns: ColumnsType<Coupon> = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            render: (code: string) => <span className="font-semibold">
                <Tag color="orange">
                    {code}
                </Tag>
            </span>,
        },
        {
            title: "Loại",
            dataIndex: "type",
            key: "type",
            render: (type: TCouponType) =>
                type === "percent" ? (
                    <Tag color="blue">Phần trăm</Tag>
                ) : (
                    <Tag color="geekblue">Cố định</Tag>
                ),
        },
        {
            title: "Giá trị",
            dataIndex: "value",
            key: "value",
            render: (value: number, record) =>
                record.type === "percent"
                    ? `${value}%`
                    : `${value.toLocaleString("vi-VN")} đ`,
        },
        {
            title: "Đơn tối thiểu",
            dataIndex: "min_order",
            key: "min_order",
            render: (v?: number | null) =>
                v ? (
                    `${v.toLocaleString("vi-VN")} đ`
                ) : (
                    <span className="text-slate-400">Không</span>
                ),
        },
        {
            title: "Giảm tối đa",
            dataIndex: "max_discount",
            key: "max_discount",
            render: (v?: number | null) =>
                v ? (
                    `${v.toLocaleString("vi-VN")} đ`
                ) : (
                    <span className="text-slate-400">Không</span>
                ),
        },
        {
            title: "Hiệu lực",
            key: "date",
            render: (_, record) => (
                <div className="text-xs">
                    <div>Từ: {dayjs(record.start_date).format("DD/MM/YYYY")}</div>
                    <div>
                        Đến:{" "}
                        {record.end_date
                            ? dayjs(record.end_date).format("DD/MM/YYYY")
                            : "Không giới hạn"}
                    </div>
                </div>
            ),
        },
        {
            title: "Lượt sử dụng",
            key: "usage",
            render: (_, record) => {
                const used = record.used_count ?? 0;
                const limit = record.usage_limit ?? null;
                const users = record.user_count ?? 0;
                return (
                    <div className="text-xs">
                        <div>
                            Đã dùng: {used}
                            {limit != null ? ` / ${limit}` : ""}
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
                is_active ? (
                    <Tag color="green">Đang hoạt động</Tag>
                ) : (
                    <Tag color="red">Đã tắt</Tag>
                ),
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
                        // Vô hiệu (soft delete)
                        <Popconfirm
                            trigger={"click"}
                            title="Vô hiệu hoá coupon này?"
                            description="Coupon sẽ được tắt."
                            okText="Đồng ý"
                            cancelText="Huỷ"
                            onConfirm={() => handleSoftDelete(record._id)}
                        >
                            <Button size="middle" type="link" variant="filled"
                                color="danger">
                                Vô hiệu
                            </Button>
                        </Popconfirm>
                    ) : (
                        // Xoá cứng (hard delete) – chỉ áp dụng với coupon đã tắt
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
    ];

    // ===== Modal create / edit =====
    const openCreateModal = () => {
        setEditingCoupon(null);
        form.resetFields();
        form.setFieldsValue({
            type: "percent",
            is_active: true,
        } as any);
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
            if (err?.errorFields) return; // lỗi validate form
            console.error(err);
            message.error(err?.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleSoftDelete = async (id: string) => {
        try {
            await API.delete(`/admin/coupons/${id}`);
            message.success("Đã vô hiệu hoá coupon");
            fetchCoupons();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không vô hiệu được coupon");
        }
    };

    const handleHardDelete = async (id: string) => {
        try {
            await API.delete(`/admin/coupons/${id}`, {
                params: { force: "true" },
            });
            message.success("Đã xoá vĩnh viễn coupon");
            fetchCoupons();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không xoá được coupon");
        }
    };

    const handleTableChange = (p: TablePaginationConfig) => {
        fetchCoupons(p.current, p.pageSize);
    };

    const tabItems: TabsProps["items"] = [
        { key: "active", label: "Đang hoạt động" },
        { key: "inactive", label: "Đã tắt" },
        { key: "all", label: "Tất cả" },
    ];

    // ===== Render =====
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Quản lý Coupon</h2>
                    <p className="text-xs text-slate-500">
                        Tạo, chỉnh sửa và quản lý các mã giảm giá.
                    </p>
                </div>
            </div>

            {/* Tabs trạng thái */}
            <Tabs
                activeKey={activeTab}
                items={tabItems}
                onChange={(k) => {
                    setActiveTab(k as ActiveTab);
                    setPagination((p) => ({ ...p, current: 1 }));
                }}
            />

            {/* Bộ lọc */}
            <div className="rounded-lg border bg-white p-3 flex flex-wrap gap-4 items-end">
                <div>
                    <div className="text-xs mb-1 font-medium text-slate-600">
                        Mã coupon
                    </div>
                    <Input
                        placeholder="Nhập mã..."
                        allowClear
                        style={{ width: 180 }}
                        value={filters.code}
                        onChange={(e) =>
                            setFilters((f) => ({
                                ...f,
                                code: e.target.value || undefined,
                            }))
                        }
                    />
                    <Button
                    className="ml-10"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                    >
                        Tạo coupon
                    </Button>
                </div>

                <div>
                    <div className="text-xs mb-1 font-medium text-slate-600">Loại</div>
                    <Select
                        style={{ width: 160 }}
                        value={filters.type}
                        onChange={(val) =>
                            setFilters((f) => ({ ...f, type: val as any }))
                        }
                        options={[
                            { label: "Tất cả", value: "all" },
                            { label: "Phần trăm", value: "percent" },
                            { label: "Cố định", value: "fixed" },
                        ]}
                    />
                </div>

                <Button onClick={() => fetchCoupons()} disabled={loading}>
                    Làm mới
                </Button>
            </div>

            {/* Bảng */}
            <div className="rounded-lg border bg-white p-3">
                <Table<Coupon>
                    rowKey="_id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </div>

            {/* Modal tạo / sửa */}
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
                    initialValues={{
                        type: "percent",
                        is_active: true,
                    }}
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
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="10 (nếu %), 50000 (nếu VNĐ)"
                        />
                    </Form.Item>

                    <Form.Item label="Giảm tối đa (VNĐ)" name="max_discount">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Không nhập = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item label="Đơn tối thiểu (VNĐ)" name="min_order">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Không nhập = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item label="Giới hạn tổng số lượt dùng" name="usage_limit">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Không nhập = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item label="Giới hạn mỗi user" name="per_user_limit">
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Không nhập = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Ngày bắt đầu"
                        name="start_date"
                        rules={[
                            { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item label="Ngày kết thúc" name="end_date">
                        <DatePicker
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCouponPage;
