// src/pages/admin/promotions/AdminPromotions.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
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
    List,
    Pagination,
} from "antd";
import type { TableProps, TabsProps, MenuProps } from "antd";
import { Plus, MoreHorizontal } from "lucide-react";
import PromotionModal, { AdminPromotionRow } from "../components/PromotionModal";
import PromotionRelationsDrawer from "../components/PromotionRelationsDrawer";
import dayjs from "dayjs";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

type PromotionTabKey = "all" | "active" | "inactive";

interface ListResponse {
    items: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const AdminPromotions = () => {
    const isMobile = useIsMobile();

    const [promotions, setPromotions] = useState<AdminPromotionRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<PromotionTabKey>("all");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingPromotion, setEditingPromotion] = useState<AdminPromotionRow | null>(null);

    // Drawer quản lý áp dụng
    const [relationsOpen, setRelationsOpen] = useState(false);
    const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);

    // Mobile action sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<AdminPromotionRow | null>(null);

    const fetchPromotions = async (opts?: { tab?: PromotionTabKey; q?: string; page?: number; limit?: number }) => {
        const currentTab = opts?.tab ?? activeTab;
        const currentQ = opts?.q ?? q;
        const currentPage = opts?.page ?? page;
        const currentLimit = opts?.limit ?? limit;

        setLoading(true);
        try {
            const params: any = { page: currentPage, limit: currentLimit };

            if (currentQ) params.title = currentQ;

            if (currentTab === "active") params.is_active = "true";
            else if (currentTab === "inactive") params.is_active = "false";

            const res = await API.get("/admin/promotions", { params });
            const dataRes: ListResponse = res.data.data;

            const mapped: AdminPromotionRow[] = (dataRes.items ?? []).map((p: any) => ({
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
            }));

            setPromotions(mapped);
            setPage(dataRes.pagination.page ?? currentPage);
            setLimit(dataRes.pagination.limit ?? currentLimit);
            setTotal(dataRes.pagination.total ?? 0);
        } catch (error: any) {
            console.error(error);
            message.error(error?.response?.data?.msg ?? "Lỗi trong khi tải danh sách khuyến mãi");
        } finally {
            setLoading(false);
        }
    };

    // ✅ theo pattern Brand: chỉ fetch 1 lần khi mount, đổi tab/search/paging gọi fetch thủ công
    useEffect(() => {
        fetchPromotions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value: string) => {
        setQ(value);
        setPage(1);
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
            await API.patch(`/admin/promotions/${row.id}`, { is_active: !row.is_active });
            message.success("Đã cập nhật trạng thái khuyến mãi");
            setSheetOpen(false);
            fetchPromotions();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.msg || "Không thể cập nhật trạng thái");
        }
    };

    const handleHardDelete = async (id: string) => {
        try {
            setLoading(true);
            await API.delete(`/admin/promotions/${id}`, { params: { force: "true" } });
            message.success("Đã xoá khuyến mãi");
            setSheetOpen(false);
            fetchPromotions();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.msg || "Không thể xoá khuyến mãi");
        } finally {
            setLoading(false);
        }
    };

    const confirmHardDelete = (row: AdminPromotionRow) => {
        Modal.confirm({
            title: "Xoá khuyến mãi",
            content: "Hành động này sẽ xoá vĩnh viễn khuyến mãi. Bạn có chắc chắn?",
            okText: "Xoá",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            onOk: () => handleHardDelete(row.id),
        });
    };

    const openEdit = (row: AdminPromotionRow) => {
        setModalMode("edit");
        setEditingPromotion(row);
        setOpenModal(true);
        setSheetOpen(false);
    };

    const openRelations = (row: AdminPromotionRow) => {
        setSelectedPromotionId(row.id);
        setRelationsOpen(true);
        setSheetOpen(false);
    };

    const buildMenu = (row: AdminPromotionRow): MenuProps => {
        const items: MenuProps["items"] = [
            { key: "edit", label: "Sửa" },
            { key: "toggle", label: row.is_active ? "Tạm tắt" : "Bật lại" },
            { key: "relations", label: "Quản lý áp dụng" },
        ];

        if (activeTab !== "active") {
            items.push({ key: "hard_delete", label: <span className="text-red-600">Xoá cứng</span> });
        }

        return {
            items,
            onClick: ({ key }) => {
                if (key === "edit") openEdit(row);
                else if (key === "toggle") handleToggleActive(row);
                else if (key === "relations") openRelations(row);
                else if (key === "hard_delete") confirmHardDelete(row);
            },
        };
    };

    const formatRange = (row: AdminPromotionRow) => {
        const from = row.start_date ? dayjs(row.start_date).format("DD/MM/YYYY") : "N/A";
        const to = row.end_date ? dayjs(row.end_date).format("DD/MM/YYYY") : "N/A";
        return `${from} - ${to}`;
    };

    const discountSummary = (row: AdminPromotionRow) => {
        const main =
            row.discount_type === "percent"
                ? `${row.discount_value}%`
                : `${Number(row.discount_value || 0).toLocaleString("vi-VN")}₫`;

        const parts: string[] = [];
        if (row.max_discount != null) parts.push(`tối đa ${row.max_discount.toLocaleString("vi-VN")}₫`);
        if (row.min_order != null) parts.push(`đơn từ ${row.min_order.toLocaleString("vi-VN")}₫`);

        return { main, meta: parts.join(" · ") };
    };

    const columns: TableProps<AdminPromotionRow>["columns"] = useMemo(
        () => [
            {
                title: "Tiêu đề",
                dataIndex: "title",
                key: "title",
                render: (text, record) => (
                    <div>
                        <div className="font-medium">
                            <Tag color="orange">{text}</Tag>
                        </div>
                        {record.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">{record.description}</div>
                        )}
                    </div>
                ),
            },
            {
                title: "Thời gian",
                key: "time",
                render: (_text, record) => <span>{formatRange(record)}</span>,
            },
            {
                title: "Giảm giá",
                key: "discount",
                render: (_text, record) => {
                    const { main, meta } = discountSummary(record);
                    const isPercent = record.discount_type === "percent";
                    return (
                        <div className="text-xs">
                            <div className="font-medium">
                                {isPercent ? "Giảm %" : "Giảm tiền"}: {main}
                            </div>
                            {meta ? <div className="text-slate-500">{meta}</div> : null}
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
                        <Image src={url} alt={record.title} width={80} className="rounded-md object-cover" preview={{ mask: "Xem" }} />
                    ) : (
                        <span className="text-xs text-slate-400 italic">No banner</span>
                    ),
            },
            {
                title: "Trạng thái",
                dataIndex: "is_active",
                key: "is_active",
                render: (is_active: boolean) =>
                    is_active ? <Tag color="green">Đang chạy</Tag> : <Tag color="red">Đã tắt</Tag>,
            },
            {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (value: string) => {
                    if (!value) return <span className="text-xs text-slate-400 italic">N/A</span>;
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return <span className="text-xs text-slate-400 italic">N/A</span>;
                    return date.toLocaleDateString("vi-VN");
                },
            },
            {
                title: "Thao tác",
                key: "action",
                align: "center",
                render: (_text, record) => (
                    <Dropdown menu={buildMenu(record)} trigger={["click"]} placement="bottomRight">
                        <Button type="text">
                            <MoreHorizontal className="w-[25px] h-[25px]" />
                        </Button>
                    </Dropdown>
                ),
            },
        ],
        [activeTab]
    );

    const tabItems: TabsProps["items"] = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang chạy" },
        { key: "inactive", label: "Đã tắt" },
    ];

    const renderSheetActions = (row: AdminPromotionRow) => (
        <div className="space-y-2">
            <Button block onClick={() => openEdit(row)}>Sửa</Button>
            <Button block onClick={() => handleToggleActive(row)}>
                {row.is_active ? "Tạm tắt" : "Bật lại"}
            </Button>
            <Button block onClick={() => openRelations(row)}>Quản lý áp dụng</Button>

            {activeTab !== "active" && (
                <Button
                    block
                    danger
                    onClick={() => {
                        setSheetOpen(false);
                        confirmHardDelete(row);
                    }}
                >
                    Xoá cứng
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-3`}>
                    <Input.Search
                        placeholder="Tìm kiếm khuyến mãi..."
                        className={isMobile ? "w-full" : "max-w-[300px]"}
                        allowClear
                        onSearch={handleSearch}
                        onChange={(e) => {
                            if (!e.target.value) handleSearch("");
                        }}
                    />

                    <Button
                        type="primary"
                        className={isMobile ? "w-full" : ""}
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

            <div className="bg-white rounded-lg shadow p-4">
                <Tabs items={tabItems} activeKey={activeTab} onChange={onTabChange} />

                {isMobile ? (
                    <>
                        <List
                            loading={loading}
                            dataSource={promotions}
                            renderItem={(item) => {
                                const d = discountSummary(item);
                                return (
                                    <List.Item className="!px-0">
                                        <div className="w-full rounded-lg border bg-white p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex items-center justify-center">
                                                    {item.banner_url ? (
                                                        <img src={item.banner_url} className="w-full h-full object-cover bg-white" />
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500">No banner</span>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-semibold text-sm truncate">
                                                            <Tag color="orange" className="!m-0">{item.title}</Tag>
                                                        </div>
                                                        <span className="text-[11px] text-slate-400">
                                                            {item.createdAt ? dayjs(item.createdAt).format("DD/MM/YYYY") : "N/A"}
                                                        </span>
                                                    </div>

                                                    {item.description ? (
                                                        <div className="text-xs text-slate-600 line-clamp-2 mt-1">{item.description}</div>
                                                    ) : null}

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        {item.is_active ? <Tag color="green">Đang chạy</Tag> : <Tag color="red">Đã tắt</Tag>}
                                                        <Tag color="blue">{formatRange(item)}</Tag>
                                                        <Tag color="geekblue">Ưu tiên: {item.priority ?? 0}</Tag>
                                                    </div>

                                                    <div className="mt-2 text-xs">
                                                        <div className="font-medium">
                                                            {item.discount_type === "percent" ? "Giảm %" : "Giảm tiền"}: {d.main}
                                                        </div>
                                                        {d.meta ? <div className="text-slate-500">{d.meta}</div> : null}
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
                                    fetchPromotions({ page: p });
                                }}
                            />
                        </div>

                        <MobileActionSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            title={<span className="font-semibold">{sheetItem?.title}</span>}
                        >
                            {sheetItem ? renderSheetActions(sheetItem) : null}
                        </MobileActionSheet>
                    </>
                ) : (
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
                )}
            </div>

            <PromotionModal
                open={openModal}
                mode={modalMode}
                promotion={modalMode === "edit" ? editingPromotion : null}
                onClose={() => {
                    setOpenModal(false);
                    setEditingPromotion(null);
                }}
                onSaved={() => fetchPromotions()}
            />

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
