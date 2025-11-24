/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/products/AdminProducts.tsx
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
    Button,
    Input,
    Space,
    Table,
    Tag,
    Tabs,
    message,
    Popconfirm,
    Image
} from "antd";
import type { TableProps, TabsProps } from "antd";
import { Plus } from "lucide-react";
import CreateProductModal from "../components/ProductModal";
import CreateVariantModal from "../components/VariantModal";
import { useNavigate } from "react-router-dom";
import ProductModal from "../components/ProductModal";
import { toast } from "sonner";
export interface AdminProductRow {
    id: string;             // product_id
    thumbnail_url: string | null;
    product_name: string;
    slug: string;
    category_name: string;
    brand_name: string;
    for_gender: string;
    total_stock: number;    // tổng stock của các variant
    selled_amount: number;
    is_active: boolean;
    createdAt: string;      // ISO string từ BE
}

// tuỳ bạn: map với BE, mình giả định BE nhận status=active|inactive|draft
type ProductTabKey = "" | "active" | "inactive" | "draft";

interface ListResponse {
    items: AdminProductRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}


const AdminProducts = () => {
    const [openProductModal, setOpenProductModal] = useState(false);
    const [productModalMode, setProductModalMode] = useState<"create" | "edit">("create");
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const navigate = useNavigate();
    const handleDelete = async (id: string, force = false) => {
        setLoading(true);
        try {
            await API.delete(`/admin/products/${id}`, {
                params: force ? { force: true } : undefined,
            });

            message.success(
                force ? "Đã xoá sản phẩm vĩnh viễn" : "Đã ngừng bán sản phẩm"
            );

            // Cách 1: refetch list cho chắc
            await fetchProducts();
            // Cách 2 (như bạn đang làm): cập nhật local state cũng được
        } catch (error: any) {
            console.error(error);
            message.error(
                error?.response?.data?.msg ??
                (force
                    ? "Lỗi trong khi xoá vĩnh viễn sản phẩm"
                    : "Lỗi trong khi ngừng bán sản phẩm")
            );
        } finally {
            setLoading(false);
        }
    };
    const columns: TableProps<AdminProductRow>["columns"] = [
        {
            title: "Sản phẩm",
            dataIndex: "product_name",
            key: "product_name",
            render: (_text, record) => (
                <div>
                    <div className="font-medium">{record.product_name}</div>
                    <div className="text-xs text-slate-500">/{record.slug}</div>
                </div>
            ),
        },

        // 3) DANH MỤC
        {
            title: "Danh mục",
            dataIndex: "category_name",
            key: "category_name",
        },

        // 4) THƯƠNG HIỆU
        {
            title: "Thương hiệu",
            dataIndex: "brand_name",
            key: "brand_name",
        },
        {
            title: "Đối tượng",
            dataIndex: "for_gender",
            key: "for_gender",
            render: (g: string) => {
                const map: Record<string, string> = {
                    male: "Nam",
                    female: "Nữ",
                    unisex: "Unisex",
                    kids: "Trẻ em",
                };
                return map[g] || g;
            },
        },
        // 5) TỒN KHO TỔNG
        {
            title: "Tồn kho",
            fixed: "right",
            dataIndex: "total_stock",
            key: "total_stock",
            render: (value: number) => (
                <span className={value === 0 ? "text-red-500" : ""}>{value}</span>
            ),
        },

        // 6) ĐÃ BÁN
        {
            title: "Đã bán",
            dataIndex: "selled_amount",
            key: "selled_amount",
        },
        {
            title: "Ảnh",
            dataIndex: "thumbnail_url",
            key: "thumbnail",
            align: 'center',
            width: 100,
            render: (url, record) =>
                url ? (
                    <Image
                        src={url}
                        alt={record.product_name}
                        width={80}
                        className="rounded-md object-cover hover:scale-110 shadow-lg shadow-blue-500/25 bg-cover transition-transform duration-300 bg-center cursor-pointer"
                        preview={{
                            mask: "Xem",
                        }}
                    />

                ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                        N/A
                    </div>
                ),
        },
        // 7) TRẠNG THÁI
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            render: (is_active: boolean) =>
                is_active ? (
                    <Tag color="green">Đang bán</Tag>
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
            align: "center",
            key: "action",
            fixed: "right",
            render: (_text, record) => (
                <Space>
                    <Button
                        type="link"
                        color="blue"
                        variant="filled"
                        onClick={() => {
                            navigate(`/admin/products/${record.id}/${record.slug}`)
                        }}
                    >
                        Xem chi tiết
                    </Button>
                    <Button
                        type="link"
                        color="green"
                        variant="filled"
                        onClick={() => {
                            setProductModalMode("edit");
                            setEditingProductId(record.id);
                            setOpenProductModal(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title={activeTab === "active" ? "Ngừng bán sản phẩm" : "Xoá vĩnh viễn"}
                        description={
                            activeTab === "active"
                                ? "Bạn có chắc muốn ngừng bán sản phẩm này?"
                                : "Bạn có chắc muốn xoá vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác."
                        }
                        okText={activeTab === "active" ? "Ngừng bán" : "Xoá"}
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id, activeTab !== "active")}
                    >
                        <Button color="danger" variant="filled">
                            {activeTab === "active" ? "Ngừng bán" : "Xoá"}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const [products, setProducts] = useState<AdminProductRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<ProductTabKey>("active");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchProducts = async (opts?: {
        tab?: ProductTabKey;
        q?: string;
        page?: number;
        limit?: number;
    }) => {
        const currentTab = opts?.tab ?? activeTab;
        const currentQ = opts?.q ?? q;
        const currentPage = opts?.page ?? page;
        const currentLimit = opts?.limit ?? limit;

        setLoading(true);
        try {
            const res = await API.get(`/admin/products`, {
                params: {
                    q: currentQ || undefined,
                    status: currentTab, // BE cần hỗ trợ param này
                    page: currentPage,
                    limit: currentLimit,
                },
            });

            const dataRes: ListResponse = res.data.data;
            setProducts(dataRes.items ?? []);
            setPage(dataRes.pagination.page ?? currentPage);
            setLimit(dataRes.pagination.limit ?? currentLimit);
            setTotal(dataRes.pagination.total ?? 0);
        } catch (error: any) {
            console.error(error);
            message.error(
                error?.response?.data?.msg ?? "Lỗi trong khi tải danh sách sản phẩm"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]); // mỗi lần đổi tab → load lại

    const handleSearch = (value: string) => {
        setLoading(true)
        try {
            setQ(value);
            fetchProducts({ q: value, page: 1 });
        } catch (error) {
            console.error(error);
            message.error(
                error?.response?.data?.msg ?? "Lỗi trong khi tìm kiếm danh sách sản phẩm"
            );
        } finally {
            setLoading(false)
        }

    };
    
    const onTabChange = (key: string) => {
        const tabKey = key as ProductTabKey;
        setActiveTab(tabKey);
        // reset page về 1 khi đổi tab
        setPage(1);
        fetchProducts({ tab: tabKey, page: 1 });
    };

    const tabItems: TabsProps["items"] = [
        {
            key: "active",
            label: "Đang bán",
        },
        {
            key: "inactive",
            label: "Ngừng bán",
        },
        {
            key: "draft",
            label: "Bản nháp",
        },
    ];

    return (
        <div className="space-y-2">
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-10">
                    <Input.Search
                        placeholder="Tìm kiếm sản phẩm..."
                        className="max-w-[300px]"
                        allowClear
                        // loading={true}
                        onSearch={handleSearch}
                        onChange={(e) => {
                            if (!e.target.value) {
                                handleSearch("");
                            }
                        }}
                    />

                    <Button
                        type="primary"
                        onClick={() => {
                            setProductModalMode("create");
                            setEditingProductId(null);
                            setOpenProductModal(true);
                        }}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Thêm sản phẩm
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <Tabs
                    items={tabItems}
                    activeKey={activeTab}
                    onChange={onTabChange}
                />
                <Table<AdminProductRow>
                    loading={loading}
                    columns={columns}
                    dataSource={products}
                    rowKey={(record) => record.id}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        onChange: (p, l) => {
                            setPage(p);
                            setLimit(l);
                            fetchProducts({ page: p, limit: l });
                        },
                    }}
                />
            </div>

            {/* Modal tạo sản phẩm */}
            <ProductModal
                open={openProductModal}
                mode={productModalMode}
                productId={productModalMode === "edit" ? editingProductId : null}
                onClose={() => {
                    setOpenProductModal(false);
                    setEditingProductId(null);
                }}
                onSaved={() => {
                    // sau khi tạo / sửa xong → refetch list hiện tại cho chắc
                    fetchProducts();
                }}
            />
        </div>
    );
};

export default AdminProducts;
