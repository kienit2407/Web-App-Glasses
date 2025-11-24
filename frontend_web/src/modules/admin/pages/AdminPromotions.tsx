// src/pages/admin/promotions/AdminPromotions.tsx
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
    message,
    Image,
    Dropdown,
    Modal,
} from "antd";
import type { TableProps, TabsProps, MenuProps } from "antd";
import { Plus, MoreHorizontal } from "lucide-react";
import PromotionModal, { AdminPromotionRow } from "../components/PromotionModal";
import PromotionRelationsDrawer from "../components/PromotionRelationsDrawer";
import dayjs from "dayjs"
type PromotionTabKey = "all" | "active" | "inactive";

interface ListResponse {
    items: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const AdminPromotions = () => {
    const [promotions, setPromotions] = useState<AdminPromotionRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<PromotionTabKey>("all");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingPromotion, setEditingPromotion] =
        useState<AdminPromotionRow | null>(null);

    // Drawer quản lý áp dụng
    const [relationsOpen, setRelationsOpen] = useState(false);
    const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
        null
    );

    const fetchPromotions = async (opts?: {
        tab?: PromotionTabKey;
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
            const params: any = {
                page: currentPage,
                limit: currentLimit,
            };

            if (currentQ) {
                params.title = currentQ;
            }

            if (currentTab === "active") {
                params.is_active = "true";
            } else if (currentTab === "inactive") {
                params.is_active = "false";
            }

            const res = await API.get("/admin/promotions", { params });
            const dataRes: ListResponse = res.data.data;

            const mapped: AdminPromotionRow[] = (dataRes.items ?? []).map(
                (p: any) => ({
                    id: String(p._id),
                    title: p.title,
                    description: p.description,
                    banner_url: p.banner_url,
                    is_active: p.is_active,
                    start_date: p.start_date,
                    end_date: p.end_date,
                    priority: p.priority ?? 0,
                    discount_type: p.discount_type,
                    discount_value: p.discount_value,
                    max_discount: p.max_discount ?? undefined,
                    min_order: p.min_order ?? undefined,
                    createdAt: p.createdAt ?? p.created_at ?? "",
                })
            );

            setPromotions(mapped);
            setPage(dataRes.pagination.page ?? currentPage);
            setLimit(dataRes.pagination.limit ?? currentLimit);
            setTotal(dataRes.pagination.total ?? 0);
        } catch (error: any) {
            console.error(error);
            message.error(
                error?.response?.data?.msg ?? "Lỗi trong khi tải danh sách khuyến mãi"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleSearch = (value: string) => {
        setQ(value);
        fetchPromotions({ q: value, page: 1 });
    };

    const onTabChange = (key: string) => {
        const tabKey = key as PromotionTabKey;
        setActiveTab(tabKey);
        setPage(1);
        fetchPromotions({ tab: tabKey, page: 1 });
    };

    const handleToggleActive = async (row: AdminPromotionRow) => {
        try {
            await API.patch(`/admin/promotions/${row.id}`, {
                is_active: !row.is_active,
            });
            message.success("Đã cập nhật trạng thái khuyến mãi");
            fetchPromotions();
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.msg || "Không thể cập nhật trạng thái";
            message.error(msg);
        }
    };

    // Xoá cứng (force = true) – chỉ dùng ở tab "Đã tắt"
    const handleHardDelete = async (id: string) => {
        try {
            setLoading(true);
            await API.delete(`/admin/promotions/${id}`, {
                params: { force: "true" },
            });
            message.success("Đã xoá khuyến mãi");
            fetchPromotions();
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.msg || "Không thể xoá khuyến mãi";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const buildMenu = (row: AdminPromotionRow): MenuProps => {
        const items: MenuProps["items"] = [
            {
                key: "edit",
                label: "Sửa",
            },
            {
                key: "toggle",
                label: row.is_active ? "Tạm tắt" : "Bật lại",
            },
            {
                key: "relations",
                label: "Quản lý áp dụng",
            },
        ];

        if (activeTab !== "active") {
            items.push({
                key: "hard_delete",
                label: <span className="text-red-600">Xoá cứng</span>,
            });
        }

        return {
            items,
            onClick: ({ key }) => {
                if (key === "edit") {
                    setModalMode("edit");
                    setEditingPromotion(row);
                    setOpenModal(true);
                } else if (key === "toggle") {
                    handleToggleActive(row);
                } else if (key === "relations") {
                    setSelectedPromotionId(row.id);
                    setRelationsOpen(true);
                } else if (key === "hard_delete") {
                    Modal.confirm({
                        title: "Xoá khuyến mãi",
                        content:
                            "Hành động này sẽ xoá vĩnh viễn khuyến mãi. Bạn có chắc chắn?",
                        okText: "Xoá",
                        cancelText: "Huỷ",
                        okButtonProps: { danger: true },
                        onOk: () => handleHardDelete(row.id),
                    });
                }
            },
        };
    };

    const columns: TableProps<AdminPromotionRow>["columns"] = [
        {
            title: "Tiêu đề",
            dataIndex: "title",
            key: "title",
            render: (text, record) => (
                <div>
                    <div className="font-medium"><Tag color="orange">
                        {text}
                    </Tag></div>
                    {record.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">

                            {record.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Thời gian",
            key: "time",
            render: (_text, record) => {
                const from = record.start_date
                    ? new Date(record.start_date).toLocaleDateString("vi-VN")
                    : "N/A";
                const to = record.end_date
                    ? new Date(record.end_date).toLocaleDateString("vi-VN")
                    : "N/A";
                return (
                    <span>
                        {from} - {to}
                    </span>
                );
            },
        },
        {
            title: "Giảm giá",
            key: "discount",
            render: (_text, record) => {
                const isPercent = record.discount_type === "percent";
                const main =
                    record.discount_type === "percent"
                        ? `${record.discount_value}%`
                        : `${record.discount_value.toLocaleString("vi-VN")}₫`;

                const parts: string[] = [main];

                if (record.max_discount != null) {
                    parts.push(
                        `tối đa ${record.max_discount.toLocaleString("vi-VN")}₫`
                    );
                }
                if (record.min_order != null) {
                    parts.push(
                        `đơn từ ${record.min_order.toLocaleString("vi-VN")}₫`
                    );
                }

                return (
                    <div className="text-xs">
                        <div className="font-medium">
                            {isPercent ? "Giảm %" : "Giảm tiền"}: {main}
                        </div>
                        {parts.length > 1 && (
                            <div className="text-slate-500">
                                {parts.slice(1).join(" · ")}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Ưu tiên",
            dataIndex: "priority",
            key: "priority",
            width: 100,
            render: (value: number) => <span>{value ?? 0}</span>,
        },
        {
            title: "Banner",
            dataIndex: "banner_url",
            key: "banner_url",
            align: "center",
            width: 120,
            render: (url: string | undefined, record) =>
                url ? (
                    <Image
                        src={url}
                        alt={record.title}
                        width={80}
                        className="rounded-md object-cover"
                        preview={{ mask: "Xem" }}
                    />
                ) : (
                    <span className="text-xs text-slate-400 italic">No banner</span>
                ),
        },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            render: (is_active: boolean) =>
                is_active ? (
                    <Tag color="green">Đang chạy</Tag>
                ) : (
                    <Tag color="red">Đã tắt</Tag>
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
            title: "Thao tác",
            key: "action",
            align: "center",
            render: (_text, record) => (
                <Dropdown
                    menu={buildMenu(record)}
                    trigger={["click"]}
                    placement="bottomRight"
                >
                    <Button type="text">
                        <MoreHorizontal className="w-[25px] h-[25px]" />
                    </Button>
                </Dropdown>
            ),
        },
    ];

    const tabItems: TabsProps["items"] = [
        {
            key: "all",
            label: "Tất cả",
        },
        {
            key: "active",
            label: "Đang chạy",
        },
        {
            key: "inactive",
            label: "Đã tắt",
        },
    ];

    return (
        <div className="space-y-2">
            {/* Header: search + button */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-10">
                    <Input.Search
                        placeholder="Tìm kiếm khuyến mãi..."
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
                        onClick={() => {
                            setModalMode("create");
                            setEditingPromotion(null);
                            setOpenModal(true);
                        }}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Thêm khuyến mãi
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow p-4">
                <Tabs items={tabItems} activeKey={activeTab} onChange={onTabChange} />

                <Table<AdminPromotionRow>
                    loading={loading}
                    columns={columns}
                    dataSource={promotions}
                    rowKey={(record) => record.id}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        onChange: (p, l) => {
                            setPage(p);
                            setLimit(l);
                            fetchPromotions({ page: p, limit: l });
                        },
                    }}
                />
            </div>

            {/* Modal tạo / sửa khuyến mãi */}
            <PromotionModal
                open={openModal}
                mode={modalMode}
                promotion={modalMode === "edit" ? editingPromotion : null}
                onClose={() => {
                    setOpenModal(false);
                    setEditingPromotion(null);
                }}
                onSaved={() => {
                    fetchPromotions();
                }}
            />

            {/* Drawer quản lý áp dụng (coupon/brand/product) */}
            <PromotionRelationsDrawer
                open={relationsOpen}
                promotionId={selectedPromotionId}
                onClose={() => {
                    setRelationsOpen(false);
                    setSelectedPromotionId(null);
                }}
            />
        </div>
    );
};

export default AdminPromotions;
