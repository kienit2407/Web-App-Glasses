/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
    Table,
    Tag,
    Button,
    Space,
    Input,
    Select,
    Popconfirm,
    message,
    List,
    Pagination,
    Modal,
    Divider,
    Dropdown,
    MenuProps,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { API } from "@/app/lib/axios-client";
import { DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { MoreHorizontal, Reply } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

interface AdminReviewRow {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user_id: { _id: string; display_name: string; email: string };
    product_id: { _id: string; product_name: string; slug: string };

    admin_reply?: null | {
        content: string;
        is_edited?: boolean;
        createdAt?: string;
        updatedAt?: string;
        admin_id?: { _id: string; display_name: string; email?: string };
    };
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const RATING_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "5 sao", value: 5 },
    { label: "4 sao", value: 4 },
    { label: "3 sao", value: 3 },
    { label: "2 sao", value: 2 },
    { label: "1 sao", value: 1 },
];

const AdminReviewsPage = () => {
    const isMobile = useIsMobile();

    const [items, setItems] = useState<AdminReviewRow[]>([]);
    const [loading, setLoading] = useState(false);

    // filters
    const [productName, setProductName] = useState("");
    const [userName, setUserName] = useState("");
    const [rating, setRating] = useState<number | null>(null);

    // pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    // Mobile action sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<AdminReviewRow | null>(null);

    // Reply modal
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyTarget, setReplyTarget] = useState<AdminReviewRow | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const fetchReviews = async (opts?: { page?: number; limit?: number }) => {
        setLoading(true);

        const pageArg = opts?.page ?? page;
        const limitArg = opts?.limit ?? limit;

        try {
            const params: any = { page: pageArg, limit: limitArg };
            if (productName.trim()) params.product_name = productName.trim();
            if (userName.trim()) params.user_name = userName.trim();
            if (typeof rating === "number") params.rating = rating;

            const res = await API.get("/admin/reviews", { params });

            const data = res.data?.data as {
                items: AdminReviewRow[];
                pagination: PaginationMeta;
            };

            setItems(data.items || []);
            setPage(data.pagination.page);
            setLimit(data.pagination.limit);
            setTotal(data.pagination.total);
        } catch (err: any) {
            console.error(err);
            message.error("Không tải được danh sách đánh giá");
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openReply = (row: AdminReviewRow) => {
        setReplyTarget(row);
        setReplyContent(row.admin_reply?.content ?? "");
        setReplyOpen(true);
        setSheetOpen(false);
    };

    const closeReply = () => {
        setReplyOpen(false);
        setReplyTarget(null);
        setReplyContent("");
    };
    const confirmDeleteReview = (id: string) => {
        Modal.confirm({
            title: "Xoá đánh giá",
            content: "Bạn có chắc muốn xoá đánh giá này?",
            okText: "Xoá",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            onOk: () => handleDelete(id),
        });
    };

    const confirmDeleteReply = (reviewId: string) => {
        Modal.confirm({
            title: "Xoá phản hồi",
            content: "Bạn có chắc muốn xoá phản hồi này?",
            okText: "Xoá",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            onOk: () => handleDeleteReplyById(reviewId),
        });
    };
    const handleDelete = async (id: string) => {
        try {
            await API.delete(`/admin/reviews/${id}`);
            message.success("Đã xoá đánh giá");
            setSheetOpen(false);
            fetchReviews();
        } catch (err) {
            console.error(err);
            message.error("Không xoá được đánh giá");
        }
    };

    const handleSearchProduct = (value: string) => {
        setProductName(value.trim());
        setPage(1);
        fetchReviews({ page: 1 });
    };

    const handleSearchUser = (value: string) => {
        setUserName(value.trim());
        setPage(1);
        fetchReviews({ page: 1 });
    };

    const handleSaveReply = async () => {
        if (!replyTarget) return;
        if (!replyContent.trim()) {
            message.warning("Nhập nội dung phản hồi");
            return;
        }

        try {
            const res = await API.patch(`/admin/reviews/${replyTarget._id}/reply`, {
                content: replyContent.trim(),
            });

            const updated = res.data?.data as AdminReviewRow;

            setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));

            message.success(replyTarget.admin_reply ? "Đã cập nhật phản hồi" : "Đã phản hồi");
            closeReply();
        } catch (err) {
            console.error(err);
            message.error("Không gửi được phản hồi");
        }
    };

    // ✅ Xoá reply theo id để dùng được ở mobile sheet (không phụ thuộc setState async)
    const handleDeleteReplyById = async (reviewId: string) => {
        try {
            const res = await API.delete(`/admin/reviews/${reviewId}/reply`);
            const updated = res.data?.data as AdminReviewRow;

            setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));

            message.success("Đã xoá phản hồi");
            setSheetOpen(false);

            // nếu đang mở modal reply của đúng review đó thì đóng lại
            setReplyOpen((open) => {
                if (!open) return open;
                if (replyTarget?._id === reviewId) {
                    closeReply();
                }
                return open;
            });
        } catch (err) {
            console.error(err);
            message.error("Không xoá được phản hồi");
        }
    };

    const columns: ColumnsType<AdminReviewRow> = useMemo(
        () => [
            {
                title: "Sản phẩm",
                dataIndex: "product_id",
                key: "product",
                render: (p) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{p?.product_name}</span>
                        {p?.slug && <span className="text-xs text-gray-500">Slug: {p.slug}</span>}
                    </div>
                ),
            },
            {
                title: "User",
                dataIndex: "user_id",
                key: "user",
                render: (u) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{u?.display_name}</span>
                        <span className="text-xs text-gray-500">{u?.email}</span>
                    </div>
                ),
            },
            {
                title: "Rating",
                dataIndex: "rating",
                key: "rating",
                width: 90,
                render: (r: number) => <Tag color={r >= 4 ? "green" : r === 3 ? "gold" : "red"}>{r} ★</Tag>,
            },
            { title: "Nội dung", dataIndex: "comment", key: "comment", ellipsis: true,  },
            {
                title: "Ngày",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 130,
                render: (v: string) =>
                    new Date(v).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    }),
            },
            {
                title: "Hành động",
                key: "action",
                width: 130,
                align: "center",
                render: (_: any, record: AdminReviewRow) => {
                    const items: MenuProps["items"] = [
                        {
                            key: "reply",
                            label: record.admin_reply?.content ? "Sửa phản hồi" : "Phản hồi",
                            onClick: () => openReply(record),
                        },

                        ...(record.admin_reply?.content
                            ? [
                                {
                                    key: "del-reply",
                                    label: "Xoá phản hồi",
                                    danger: true,
                                    onClick: () => confirmDeleteReply(record._id),
                                },
                            ]
                            : []),

                        { type: "divider" },

                        {
                            key: "del-review",
                            label: "Xoá đánh giá",
                            danger: true,
                            onClick: () => confirmDeleteReview(record._id),
                        },
                    ];

                    return (
                        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                            <Button type="text" size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                    );
                },
            }
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [replyTarget, replyContent]
    );

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-semibold">Quản lý đánh giá</h2>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-3`}>
                    <Input.Search
                        placeholder="Lọc theo sản phẩm (tên / slug)"
                        className={isMobile ? "w-full" : "w-[240px]"}
                        allowClear
                        value={productName}
                        onChange={(e) => {
                            const v = e.target.value;
                            setProductName(v);
                            if (!v) fetchReviews({ page: 1 });
                        }}
                        onSearch={handleSearchProduct}
                    />

                    <Input.Search
                        placeholder="Lọc theo người dùng (tên / email)"
                        className={isMobile ? "w-full" : "w-[240px]"}
                        allowClear
                        value={userName}
                        onChange={(e) => {
                            const v = e.target.value;
                            setUserName(v);
                            if (!v) fetchReviews({ page: 1 });
                        }}
                        onSearch={handleSearchUser}
                    />

                    <Select
                        className={isMobile ? "w-full" : "w-[170px]"}
                        options={RATING_OPTIONS}
                        placeholder="Lọc theo rating"
                        value={rating ?? ""}
                        onChange={(val) => {
                            const v = val === "" ? null : Number(val);
                            setRating(Number.isNaN(v as any) ? null : (v as number));
                            setPage(1);
                            fetchReviews({ page: 1 });
                        }}
                    />

                    <Button
                        onClick={() => {
                            setProductName("");
                            setUserName("");
                            setRating(null);
                            setPage(1);
                            fetchReviews({ page: 1 });
                        }}
                    >
                        Xoá filter
                    </Button>
                </div>
            </div>

            {/* List/Table */}
            <div className="bg-white rounded-lg shadow p-4">
                {isMobile ? (
                    <>
                        <List
                            loading={loading}
                            dataSource={items}
                            renderItem={(r) => (
                                <List.Item className="!px-0">
                                    <div className="w-full rounded-lg border bg-white p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-sm truncate">{r.product_id?.product_name}</div>
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {r.user_id?.display_name} · {r.user_id?.email}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="text"
                                                        onClick={() => {
                                                            setSheetItem(r);
                                                            setSheetOpen(true);
                                                        }}
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <Tag color={r.rating >= 4 ? "green" : r.rating === 3 ? "gold" : "red"}>{r.rating} ★</Tag>
                                                    <Tag>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</Tag>
                                                    {r.product_id?.slug ? <Tag color="blue">{r.product_id.slug}</Tag> : null}
                                                </div>

                                                {r.comment ? (
                                                    <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{r.comment}</div>
                                                ) : (
                                                    <div className="mt-2 text-xs text-slate-400 italic">Không có nội dung</div>
                                                )}

                                                {/* ✅ HIỂN THỊ PHẢN HỒI ADMIN */}
                                                {r.admin_reply?.content ? (
                                                    <>
                                                        <Divider className="!my-3" />
                                                        <div className="rounded-lg border bg-slate-50 p-3">
                                                            <div className="text-xs text-slate-500 mb-1">
                                                                Phản hồi bởi{" "}
                                                                <b>{r.admin_reply.admin_id?.display_name ?? "Admin"}</b>
                                                                {r.admin_reply.is_edited ? " · (đã chỉnh sửa)" : ""}
                                                            </div>
                                                            <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                                                {r.admin_reply.content}
                                                            </div>
                                                            {r.admin_reply.updatedAt ? (
                                                                <div className="mt-1 text-[11px] text-slate-400">
                                                                    {new Date(r.admin_reply.updatedAt).toLocaleString("vi-VN")}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
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
                                    fetchReviews({ page: p });
                                }}
                            />
                        </div>

                        {/*  MOBILE ACTION SHEET: thêm Xoá phản hồi + đổi text nút */}
                        <MobileActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={<span className="font-semibold">Thao tác</span>}>
                            {sheetItem ? (
                                <div className="space-y-2">
                                    <Button block onClick={() => openReply(sheetItem)}>
                                        {sheetItem.admin_reply?.content ? "Sửa phản hồi" : "Phản hồi"}
                                    </Button>

                                    {sheetItem.admin_reply?.content ? (
                                        <Popconfirm
                                            title="Xoá phản hồi"
                                            description="Bạn có chắc muốn xoá phản hồi này?"
                                            okText="Xoá"
                                            cancelText="Huỷ"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => handleDeleteReplyById(sheetItem._id)}
                                        >
                                            <Button block danger>
                                                Xoá phản hồi
                                            </Button>
                                        </Popconfirm>
                                    ) : null}

                                    <Popconfirm
                                        title="Xoá đánh giá"
                                        description="Bạn có chắc muốn xoá đánh giá này?"
                                        okText="Xoá"
                                        cancelText="Huỷ"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => handleDelete(sheetItem._id)}
                                    >
                                        <Button block danger>
                                            Xoá đánh giá
                                        </Button>
                                    </Popconfirm>
                                </div>
                            ) : null}
                        </MobileActionSheet>
                    </>
                ) : (
                    <Table<AdminReviewRow>
                        rowKey="_id"
                        loading={loading}
                        columns={columns}
                        dataSource={items}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total,
                            showSizeChanger: true,
                            onChange: (p, s) => {
                                setPage(p);
                                setLimit(s);
                                fetchReviews({ page: p, limit: s });
                            },
                        }}
                    />
                )}
            </div>

            {/* Reply modal */}
            <Modal
                title={replyTarget?.admin_reply?.content ? "Sửa phản hồi đánh giá" : "Phản hồi đánh giá"}
                open={replyOpen}
                onCancel={closeReply}
                footer={[
                    replyTarget?.admin_reply?.content ? (
                        <Popconfirm
                            key="del"
                            title="Xoá phản hồi?"
                            description="Bạn có chắc muốn xoá phản hồi này?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => replyTarget && handleDeleteReplyById(replyTarget._id)}
                        >
                            <Button danger>Xoá phản hồi</Button>
                        </Popconfirm>
                    ) : (
                        <span key="spacer" />
                    ),
                    <Button key="cancel" onClick={closeReply}>
                        Huỷ
                    </Button>,
                    <Button key="ok" type="primary" onClick={handleSaveReply}>
                        {replyTarget?.admin_reply?.content ? "Cập nhật" : "Gửi phản hồi"}
                    </Button>,
                ]}
            >
                {replyTarget ? (
                    <div className="space-y-3">
                        <div className="rounded-lg border p-3 bg-slate-50">
                            <div className="text-sm font-semibold">{replyTarget.product_id?.product_name}</div>
                            <div className="text-xs text-slate-600">
                                {replyTarget.user_id?.display_name} · {replyTarget.user_id?.email}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Tag color={replyTarget.rating >= 4 ? "green" : replyTarget.rating === 3 ? "gold" : "red"}>
                                    {replyTarget.rating} ★
                                </Tag>
                                <span className="text-xs text-slate-500">{new Date(replyTarget.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                            {replyTarget.comment ? (
                                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{replyTarget.comment}</div>
                            ) : (
                                <div className="mt-2 text-xs text-slate-400 italic">Không có nội dung</div>
                            )}
                        </div>

                        <Input.TextArea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Nhập nội dung phản hồi…"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default AdminReviewsPage;
