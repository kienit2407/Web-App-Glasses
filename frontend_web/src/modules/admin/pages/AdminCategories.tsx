/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/categories/AdminCategories.tsx
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import { Button, Input, Space, Table, Tag, Popconfirm, Tabs } from "antd";
import type { TableProps, TabsProps } from "antd";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CategoryModal from "../components/CategoryModal";

export interface AdminCategoryRow {
    id: string;
    category_name: string;
    slug: string;
    description?: string | null;
    parent_id?: string | null;
    parent_name?: string | null;
    is_active: boolean;
    createdAt: string;
}
type CategoryTabKey = "active" | "inactive"
interface ListResponse {
    items: AdminCategoryRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const AdminCategories = () => {
    const [data, setData] = useState<AdminCategoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<CategoryTabKey>("active");
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editingCategory, setEditingCategory] = useState<AdminCategoryRow | null>(null);

    const fetchCategories = async (opts?: { q?: string; page?: number; limit?: number, tab?: CategoryTabKey }) => {
        setLoading(true);
        try {
            const currentQ = opts?.q ?? q;
            const currentPage = opts?.page ?? page;
            const currentLimit = opts?.limit ?? limit;
            const currentTab = opts?.tab ?? activeTab;
            const res = await API.get("/admin/categories", {
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
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.msg ?? "Lỗi trong khi tải danh mục");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value: string) => {
        setQ(value);
        fetchCategories({ q: value, page: 1 });
    };

    const handleDelete = async (id: string) => {
        try {
            if (activeTab === "active") {
                // Soft delete: ngừng dùng
                await API.delete(`/admin/categories/${id}`);
                toast.success("Đã ngừng dùng danh mục");
            } else {
                // Inactive tab => xoá vĩnh viễn
                await API.delete(`/admin/categories/${id}`, {
                    params: { force: true },
                });
                toast.success("Đã xoá vĩnh viễn danh mục");
            }

            setData((prev) => prev.filter((c) => c.id !== id));
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.msg ?? (activeTab === "active"
                ? "Ngừng dùng danh mục thất bại"
                : "Xoá vĩnh viễn danh mục thất bại"));
        }
    };
    const onTabChange = (key: string) => {
        const tabKey = key as CategoryTabKey;
        setActiveTab(tabKey);
        setPage(1);
        fetchCategories({ tab: tabKey, page: 1 });
    };
    const columns: TableProps<AdminCategoryRow>["columns"] = [
        {
            title: "Tên danh mục",
            dataIndex: "category_name",
            key: "category_name",
            render: (_text, record) => (
                <div>
                    <div className="font-medium">{record.category_name}</div>
                    <div className="text-xs text-slate-500">/{record.slug}</div>
                </div>
            ),
        },
        {
            title: "Danh mục cha",
            dataIndex: "parent_name",
            key: "parent_name",
            render: (value: string | null) =>
                value ? (
                    <span>{value}</span>
                ) : (
                    <span className="text-slate-400 text-xs italic">Danh mục gốc</span>
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
                    <Tag color="red">Ngừng kinh doanh</Tag>
                ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value: string) => {
                const date = new Date(value);
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
                            setEditingCategory(record);
                            setOpenModal(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title={
                            activeTab === "active"
                                ? "Ngừng dùng danh mục"
                                : "Xoá vĩnh viễn danh mục"
                        }
                        description={
                            activeTab === "active"
                                ? "Bạn có chắc muốn ngừng dùng danh mục này?"
                                : "Bạn có chắc muốn xoá vĩnh viễn danh mục này? Hành động này không thể hoàn tác."
                        }
                        okText={activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button
                            variant="filled"
                            color="danger"
                            type="link"
                            danger>
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
    ]
    return (
        <div className="space-y-2">
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-10">
                    <Input.Search
                        placeholder="Tìm kiếm danh mục..."
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
                            setEditingCategory(null);
                            setOpenModal(true);
                        }}
                    >
                        Thêm danh mục
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <Table<AdminCategoryRow>
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
                            fetchCategories({ page: p, limit: l });
                        },
                    }}
                />
            </div>

            <CategoryModal
                open={openModal}
                mode={mode}
                categories={data}
                editingCategory={editingCategory}
                onClose={() => setOpenModal(false)}
                onSaved={(cat) => {
                    if (mode === "create") {
                        setData((prev) => [cat, ...prev]);
                    } else {
                        setData((prev) =>
                            prev.map((c) => (c.id === cat.id ? cat : c))
                        );
                    }
                }}
            />
        </div>
    );
};

export default AdminCategories;
