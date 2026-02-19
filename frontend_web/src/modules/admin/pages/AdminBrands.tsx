/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { API } from "@/app/lib/axios-client";
import { Button, Input, List, Pagination, Popconfirm, Space, Table, Tag, Tabs } from "antd";
import type { TableProps, TabsProps } from "antd";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import BrandModal from "../components/BrandModal";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

export interface AdminBrandRow {
    id: string;
    brand_name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    is_active: boolean;
    createdAt: string;
}
type BrandTabKey = "active" | "inactive";

interface ListResponse {
    items: AdminBrandRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const AdminBrands = () => {
    const isMobile = useIsMobile();

    const [data, setData] = useState<AdminBrandRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<BrandTabKey>("active");

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editingBrand, setEditingBrand] = useState<AdminBrandRow | null>(null);

    // action sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<AdminBrandRow | null>(null);

    const fetchBrands = async (opts?: { q?: string; page?: number; limit?: number; tab?: BrandTabKey }) => {
        setLoading(true);
        try {
            const currentQ = opts?.q ?? q;
            const currentPage = opts?.page ?? page;
            const currentLimit = opts?.limit ?? limit;
            const currentTab = opts?.tab ?? activeTab;

            const res = await API.get("/admin/brands", {
                params: { q: currentQ, page: currentPage, limit: currentLimit, status: currentTab },
            });

            const dataRes: ListResponse = res.data.data;
            setData(dataRes.items);
            setPage(dataRes.pagination.page);
            setLimit(dataRes.pagination.limit);
            setTotal(dataRes.pagination.total);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.msg ?? "Lỗi trong khi tải thương hiệu");
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
                await API.delete(`/admin/brands/${id}`);
                toast.success("Đã ngừng dùng thương hiệu");
            } else {
                await API.delete(`/admin/brands/${id}`, { params: { force: true } });
                toast.success("Đã xoá vĩnh viễn thương hiệu");
            }
            setData((prev) => prev.filter((b) => b.id !== id));
            setSheetOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.msg ??
                (activeTab === "active" ? "Ngừng dùng thương hiệu thất bại" : "Xoá vĩnh viễn thương hiệu thất bại")
            );
        }
    };

    const columns: TableProps<AdminBrandRow>["columns"] = useMemo(
        () => [
            {
                title: "Logo",
                dataIndex: "logo_url",
                key: "logo_url",
                width: 80,
                render: (url: string | null | undefined) =>
                    url ? (
                        <img src={url} alt="logo" className="w-12 h-12 object-contain rounded bg-white" />
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
                render: (is_active: boolean) => (is_active ? <Tag color="green">Đang dùng</Tag> : <Tag color="red">Tạm ẩn</Tag>),
            },
            {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (value: string) => (value ? new Date(value).toLocaleDateString("vi-VN") : "N/A"),
            },
            {
                title: "Action",
                key: "action",
                render: (_text, record) => (
                    <Space>
                        <Button
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
                            title={activeTab === "active" ? "Ngừng dùng thương hiệu" : "Xoá vĩnh viễn thương hiệu"}
                            okText={activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button type="link" danger>
                                {activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [activeTab]
    );

    const tabItems: TabsProps["items"] = [
        { key: "active", label: "Đang dùng" },
        { key: "inactive", label: "Ngừng dùng" },
    ];

    return (
        <div className="space-y-2">
            <div className="bg-white rounded-lg shadow p-4">
                <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-3`}>
                    <Input.Search
                        placeholder="Tìm kiếm thương hiệu..."
                        className={isMobile ? "w-full" : "max-w-[300px]"}
                        allowClear
                        onSearch={handleSearch}
                        onChange={(e) => {
                            if (!e.target.value) handleSearch("");
                        }}
                    />

                    <Button
                        type="primary"
                        icon={<Plus className="w-4 h-4" />}
                        className={isMobile ? "w-full" : ""}
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
                <Tabs items={tabItems} activeKey={activeTab} onChange={onTabChange} />

                {isMobile ? (
                    <>
                        <List
                            loading={loading}
                            dataSource={data}
                            renderItem={(item) => (
                                <List.Item className="!px-0">
                                    <div className="w-full rounded-lg border bg-white p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex items-center justify-center">
                                                {item.logo_url ? (
                                                    <img src={item.logo_url} className="w-full h-full object-contain bg-white" />
                                                ) : (
                                                    <span className="text-xs text-slate-500">N/A</span>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm truncate">{item.brand_name}</div>
                                                <div className="text-xs text-slate-500 truncate">/{item.slug}</div>

                                                <div className="mt-2 flex items-center gap-2">
                                                    {item.is_active ? <Tag color="green">Đang dùng</Tag> : <Tag color="red">Tạm ẩn</Tag>}
                                                    <span className="text-xs text-slate-500">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                                                    </span>
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
                            )}
                        />

                        <div className="pt-3 flex justify-end">
                            <Pagination
                                current={page}
                                pageSize={limit}
                                total={total}
                                showSizeChanger={false}
                                onChange={(p) => {
                                    setPage(p);
                                    fetchBrands({ page: p });
                                }}
                            />
                        </div>

                        <MobileActionSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            title={<span className="font-semibold">{sheetItem?.brand_name}</span>}
                        >
                            <div className="space-y-2">
                                <Button
                                    block
                                    onClick={() => {
                                        if (!sheetItem) return;
                                        setMode("edit");
                                        setEditingBrand(sheetItem);
                                        setOpenModal(true);
                                        setSheetOpen(false);
                                    }}
                                >
                                    Sửa
                                </Button>

                                <Popconfirm
                                    title={activeTab === "active" ? "Ngừng dùng thương hiệu" : "Xoá vĩnh viễn thương hiệu"}
                                    okText={activeTab === "active" ? "Ngừng dùng" : "Xoá"}
                                    cancelText="Huỷ"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => sheetItem?.id && handleDelete(sheetItem.id)}
                                >
                                    <Button block danger>
                                        {activeTab === "active" ? "Ngừng dùng" : "Xoá vĩnh viễn"}
                                    </Button>
                                </Popconfirm>
                            </div>
                        </MobileActionSheet>
                    </>
                ) : (
                    <Table<AdminBrandRow>
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
                )}
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
                        setData((prev) => prev.map((b) => (b.id === normalized.id ? normalized : b)));
                    }
                }}
            />
        </div>
    );
};

export default AdminBrands;
