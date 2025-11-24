// src/pages/admin/brands/AdminBrands.tsx
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import { Button, Input, Space, Table, Tag, Popconfirm, Tabs } from "antd";
import type { TableProps, TabsProps } from "antd";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import BrandModal from "../components/BrandModal";

export interface AdminBrandRow {
    id: string;
    brand_name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    is_active: boolean;
    createdAt: string;
}
type BrandTabKey = "active" | "inactive"
interface ListResponse {
    items: AdminBrandRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const AdminBrands = () => {
    const [data, setData] = useState<AdminBrandRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<BrandTabKey>("active")
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editingBrand, setEditingBrand] = useState<AdminBrandRow | null>(null);

    const fetchBrands = async (opts?: {
        q?: string;
        page?: number;
        limit?: number;
        tab?: BrandTabKey
    }) => {
        setLoading(true);
        try {
            const currentQ = opts?.q ?? q;
            const currentPage = opts?.page ?? page;
            const currentLimit = opts?.limit ?? limit;
            const currentTab = opts?.tab ?? activeTab;
            const res = await API.get("/admin/brands", {
                params: {
                    q: currentQ,
                    page: currentPage,
                    limit: currentLimit,
                    status: currentTab, // <-- mới
                },
            });

            const dataRes: ListResponse = res.data.data;
            setData(dataRes.items);
            setPage(dataRes.pagination.page);
            setLimit(dataRes.pagination.limit);
            setTotal(dataRes.pagination.total);
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.msg ?? "Lỗi trong khi tải thương hiệu"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value: string) => {
        setQ(value);
        fetchBrands({ q: value, page: 1 });
    };
    const onTabChange = (key: string) => {
        const tabKey = key as BrandTabKey;
        setActiveTab(tabKey);
        setPage(1);
        fetchBrands({ tab: tabKey, page: 1 });
    };
    const handleDelete = async (id: string) => {
        try {
            if (activeTab === "active") {
                // Soft delete: ngừng dùng
                await API.delete(`/admin/brands/${id}`);
                toast.success("Đã ngừng dùng thương hiệu");
            } else {
                // Inactive tab => xoá vĩnh viễn
                await API.delete(`/admin/brands/${id}`, {
                    params: { force: true },
                });
                toast.success("Đã xoá vĩnh viễn thương hiệu");
            }

            // Có thể refetch hoặc chỉ lọc local
            setData((prev) => prev.filter((b) => b.id !== id));
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.msg ??
                (activeTab === "active"
                    ? "Ngừng dùng thương hiệu thất bại"
                    : "Xoá vĩnh viễn thương hiệu thất bại")
            );
        }

    };

    const columns: TableProps<AdminBrandRow>["columns"] = [
        {
            title: "Logo",
            dataIndex: "logo_url",
            key: "logo_url",
            width: 80,
            render: (url: string | null | undefined) =>
                url ? (
                    <img
                        src={url}
                        alt="logo"
                        className="w-12 h-12 object-contain rounded bg-white"
                    />
                ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                        N/A
                    </div>
                ),
        },
        {
            title: "Thương hiệu",
            dataIndex: "brand_name",
            key: "brand_name",
            render: (_text, record) => (
                <div>
                    <div className="font-medium">{record.brand_name}</div>
                    <div className="text-xs text-slate-500">/{record.slug}</div>
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            render: (is_active: boolean) =>
                is_active ? (
                    <Tag color="green">Đang dùng</Tag>
                ) : (
                    <Tag color="red">Tạm ẩn</Tag>
                ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value: string) => {
                if (!value) {
                    return (
                        <span className="text-xs text-slate-400 italic">N/A</span>
                    );
                }
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) {
                    return (
                        <span className="text-xs text-slate-400 italic">N/A</span>
                    );
                }
                return date.toLocaleDateString("vi-VN");
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_text, record) => (
                <Space>
                    <Button
                        variant="filled"
                        color="green"
                        type="link"
                        onClick={() => {
                            setMode("edit");
                            setEditingBrand(record);
                            setOpenModal(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title={
                            activeTab === "active"
                                ? "Ngừng dùng thương hiệu"
                                : "Xoá vĩnh viễn thương hiệu"
                        }
                        description={
                            activeTab === "active"
                                ? "Bạn có chắc muốn ngừng dùng thương hiệu này?"
                                : "Bạn có chắc muốn xoá vĩnh viễn thương hiệu này? Hành động này không thể hoàn tác."
                        }
                        okText={activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="link" color="danger" danger variant="filled">
                            {activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        }
    ];
    const tabItems: TabsProps["items"] = [
        { key: "active", label: "Đang dùng" },
        { key: "inactive", label: "Ngừng dùng" },
    ];
    return (
        <div className="space-y-2">
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-10">
                    <Input.Search
                        placeholder="Tìm kiếm thương hiệu..."
                        className="max-w-[300px]"
                        allowClear
                        onSearch={handleSearch}
                        onChange={(e) => {
                            if (!e.target.value) {
                                handleSearch("");
                            }
                        }}
                    />

                    <Button
                        type="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                            setMode("create");
                            setEditingBrand(null);
                            setOpenModal(true);
                        }}
                    >
                        Thêm thương hiệu
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <Table<AdminBrandRow>
                    title={() => (
                        <Tabs
                            items={tabItems}
                            activeKey={activeTab}
                            onChange={onTabChange}
                        />
                    )}
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    rowKey={(record) => record.id}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        onChange: (p, l) => {
                            setPage(p);
                            setLimit(l);
                            fetchBrands({ page: p, limit: l });
                        },
                    }}
                />
            </div>

            <BrandModal
                open={openModal}
                mode={mode}
                editingBrand={editingBrand || undefined}
                onClose={() => setOpenModal(false)}
                onSaved={(raw) => {
                    const normalized: AdminBrandRow = {
                        id: raw.id || raw._id,
                        brand_name: raw.brand_name,
                        slug: raw.slug,
                        description: raw.description ?? null,
                        logo_url: raw.logo_url ?? null,
                        is_active: raw.is_active,
                        createdAt: raw.createdAt,
                    };

                    if (mode === "create") {
                        setData((prev) => [normalized, ...prev]);
                    } else {
                        setData((prev) =>
                            prev.map((b) => (b.id === normalized.id ? normalized : b))
                        );
                    }
                }}
            />
        </div>
    );
};

export default AdminBrands;
