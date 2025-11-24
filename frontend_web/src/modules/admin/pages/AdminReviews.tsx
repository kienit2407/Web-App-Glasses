/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Table, Tag, Button, Space, Input, Select, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { API } from "@/app/lib/axios-client";
import { DeleteOutlined } from "@ant-design/icons";

interface AdminReviewRow {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user_id: {
        _id: string;
        display_name: string;
        email: string;
    };
    product_id: {
        _id: string;
        product_name: string;
        slug: string;
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
    const [items, setItems] = useState<AdminReviewRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [productName, setProductName] = useState("");
    const [userName, setUserName] = useState("");
    const [productId, setProductId] = useState("");
    const [userId, setUserId] = useState("");
    const [rating, setRating] = useState<number | null>();

    const fetchReviews = async (opts?: { page?: number; limit?: number }) => {
        setLoading(true);

        // dùng state hiện tại, opts chỉ override page/limit nếu truyền vào
        const pageArg = opts?.page ?? page;
        const limitArg = opts?.limit ?? limit;

        try {
            const params: any = {
                page: pageArg,
                limit: limitArg,
            };

            if (productName) params.product_name = productName; // hoặc product_id tuỳ BE
            if (userName) params.user_name = userName;         // hoặc user_id
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
    const handleSearchProduct = (value: string) => {
        setProductName(value.trim());
        fetchReviews({ page: 1 });   // reset về page 1 với filter mới
    };

    const handleSearchUser = (value: string) => {
        setUserName(value.trim());
        fetchReviews({ page: 1 });
    };
    useEffect(() => {
        fetchReviews({ page: 1 });
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, userId, rating, limit]);

    const handleDelete = async (id: string) => {
        try {
            await API.delete(`/admin/reviews/${id}`);
            message.success("Đã xoá đánh giá");
            fetchReviews();
        } catch (err) {
            console.error(err);
            message.error("Không xoá được đánh giá");
        }
    };

    const columns: ColumnsType<AdminReviewRow> = [
        {
            title: "Sản phẩm",
            dataIndex: "product_id",
            key: "product",
            render: (p) => (
                <div className="flex flex-col">
                    <span className="font-medium">{p?.product_name}</span>
                    {p?.slug && (
                        <span className="text-xs text-gray-500">Slug: {p.slug}</span>
                    )}
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
            render: (r: number) => (
                <Tag color={r >= 4 ? "green" : r === 3 ? "gold" : "red"}>
                    {r} ★
                </Tag>
            ),
        },
        {
            title: "Nội dung",
            dataIndex: "comment",
            key: "comment",
            ellipsis: true,
        },
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
            width: 100,
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title="Xoá đánh giá"
                        description="Bạn có chắc muốn xoá đánh giá này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý đánh giá</h2>

            <div className="flex flex-wrap gap-3 mb-4">
                <Input.Search
                    placeholder="Lọc theo sản phẩm (tên / slug)"
                    style={{ width: 220 }}
                    allowClear
                    onSearch={handleSearchProduct}   // chỉ gọi khi Enter / click icon Search
                />

                <Input.Search
                    placeholder="Lọc theo người dùng (tên / email)"
                    style={{ width: 220 }}
                    allowClear
                    onSearch={handleSearchUser}
                />

                <Select
                    style={{ width: 160 }}
                    options={RATING_OPTIONS}
                    placeholder="Lọc theo rating"
                    value={rating ?? ""}
                    onChange={(val) => {
                        const v = Number(val) || null;
                        setRating(v);
                        fetchReviews({ page: 1 });      // đổi rating thì fetch ngay
                    }}
                />

                <Button
                    onClick={() => {
                        setProductName("");
                        setUserName("");
                        setRating(undefined);
                        fetchReviews({ page: 1 });      // load lại full list
                    }}
                >
                    Xoá filter
                </Button>
            </div>

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
                        fetchReviews({ page: 1 });
                    },
                }}
            />
        </div>
    );
};

export default AdminReviewsPage;
