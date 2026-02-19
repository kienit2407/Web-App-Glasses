/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Breadcrumb,
    Card,
    Table,
    Button,
    Tag,
    Space,
    Skeleton,
    Popconfirm,
    Tabs,
    List,
} from "antd";
import type { TableProps } from "antd";
import { API } from "@/app/lib/axios-client";
import CreateVariantModal from "../components/VariantModal";
import { MoveLeft, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import VariantImagesModal from "../components/VariantImagesModal";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

interface ProductDetail {
    _id: string;
    product_name: string;
    slug: string;
}

interface VariantRow {
    _id: string;
    sku_variant: string;
    frame_material: string;
    frame_color: string;
    frame_shape: string;
    price: number;
    sale_price?: number;
    stock: number;
    is_active: boolean;
}

interface ProductDetailResponse {
    product: ProductDetail;
    variants: VariantRow[];
}

const AdminVariants = () => {
    const isMobile = useIsMobile();
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();

    const [data, setData] = useState<ProductDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const [openCreateVariant, setOpenCreateVariant] = useState(false);
    const [variantModalMode, setVariantModalMode] = useState<"create" | "edit">("create");
    const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

    const [variantTab, setVariantTab] = useState<"active" | "inactive">("active");

    const [openVariantImages, setOpenVariantImages] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // mobile sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetItem, setSheetItem] = useState<VariantRow | null>(null);

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [productRes, variantsRes] = await Promise.all([
                API.get(`/admin/products/${id}`),
                API.get(`/admin/products/${id}/variants`),
            ]);

            setData({
                product: productRes.data?.data?.product || productRes.data?.data,
                variants: variantsRes.data?.data?.items || variantsRes.data?.data || [],
            });
        } catch (err) {
            console.error("Lỗi khi tải chi tiết sản phẩm:", err);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleDeleteVariant = async (variantId: string) => {
        try {
            if (variantTab === "active") {
                await API.delete(`/admin/products/variants/${variantId}`); // soft delete: ngừng bán
                toast.success("Đã ngừng bán biến thể");
            } else {
                await API.delete(`/admin/products/variants/${variantId}`, { params: { force: true } });
                toast.success("Đã xoá vĩnh viễn biến thể");
            }
            setSheetOpen(false);
            fetchDetail();
        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.msg ||
                (variantTab === "active" ? "Không thể ngừng bán biến thể" : "Không thể xoá vĩnh viễn biến thể")
            );
        }
    };

    const money = (v: number) =>
        v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const columns: TableProps<VariantRow>["columns"] = useMemo(
        () => [
            { title: "SKU", dataIndex: "sku_variant", key: "sku_variant" },
            { title: "Màu", dataIndex: "frame_color", key: "frame_color" },
            { title: "Chất liệu", dataIndex: "frame_material", key: "frame_material" },
            { title: "Dáng kính", dataIndex: "frame_shape", key: "frame_shape" },
            {
                title: "Giá",
                key: "price",
                render: (_: any, record: VariantRow) => {
                    const hasSale = record.sale_price != null && record.sale_price < record.price;
                    const finalPrice = hasSale ? record.sale_price! : record.price;
                    const crossed = hasSale ? record.price : null;

                    return (
                        <div className="space-y-0.5">
                            <div className="font-medium text-red-500">{money(finalPrice)}</div>
                            {crossed && <div className="text-xs line-through text-slate-400">{money(crossed)}</div>}
                        </div>
                    );
                },
            },
            { title: "Tồn kho", dataIndex: "stock", key: "stock" },
            {
                title: "Trạng thái",
                dataIndex: "is_active",
                key: "is_active",
                render: (v: boolean) => (v ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Tạm ẩn</Tag>),
            },
            {
                title: "Action",
                key: "action",
                render: (_, record) => (
                    <Space>
                        <Button
                            type="link"
                            color="green"
                            variant="filled"
                            onClick={() => {
                                setVariantModalMode("edit");
                                setEditingVariantId(record._id);
                                setOpenCreateVariant(true);
                            }}
                        >
                            Sửa
                        </Button>

                        <Button
                            type="link"
                            variant="filled"
                            color="blue"
                            onClick={() => {
                                setSelectedVariantId(record._id);
                                setOpenVariantImages(true);
                            }}
                        >
                            Ảnh
                        </Button>

                        <Popconfirm
                            title={variantTab === "active" ? "Ngừng bán biến thể" : "Xoá biến thể"}
                            description={
                                variantTab === "active"
                                    ? "Biến thể sẽ chuyển sang trạng thái ngừng bán."
                                    : "Hành động này xoá vĩnh viễn biến thể."
                            }
                            okText={variantTab === "active" ? "Ngừng bán" : "Xoá"}
                            cancelText="Huỷ"
                            okButtonProps={{ danger: variantTab !== "active" }}
                            onConfirm={() => handleDeleteVariant(record._id)}
                        >
                            <Button color={variantTab === "active" ? "orange" : "danger"} variant="filled">
                                {variantTab === "active" ? "Ngừng bán" : "Xoá"}
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [variantTab]
    );

    if (loading || !data) return <Skeleton active />;

    const { product, variants } = data;
    const filteredVariants = variants.filter((v) => (variantTab === "active" ? v.is_active : !v.is_active));

    const openEdit = (v: VariantRow) => {
        setVariantModalMode("edit");
        setEditingVariantId(v._id);
        setOpenCreateVariant(true);
        setSheetOpen(false);
    };

    const openImages = (v: VariantRow) => {
        setSelectedVariantId(v._id);
        setOpenVariantImages(true);
        setSheetOpen(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Breadcrumb
                    className="[&_a]:text-blue-600 font-bold"
                    items={[
                        { title: <Link to="/admin/products">Sản phẩm</Link> },
                        { title: product.product_name },
                        { title: "Biến thể" },
                    ]}
                />
            </div>

            <div className="flex items-center">
                <Button onClick={() => nav(-1)}>
                    <MoveLeft />
                    Quay lại
                </Button>
            </div>

            <Card
                title={
                    <div className={`flex ${isMobile ? "flex-col" : "items-center justify-between"} gap-2`}>
                        <span>
                            Biến thể của: <b>{product.product_name}</b>{" "}
                            <span className="text-slate-400">/{product.slug}</span>
                        </span>

                        <Button
                            type="primary"
                            className={isMobile ? "w-full" : ""}
                            onClick={() => {
                                setVariantModalMode("create");
                                setEditingVariantId(null);
                                setOpenCreateVariant(true);
                            }}
                        >
                            Thêm biến thể
                        </Button>
                    </div>
                }
            >
                <Tabs
                    items={[
                        { key: "active", label: "Đang bán" },
                        { key: "inactive", label: "Ngừng bán" },
                    ]}
                    activeKey={variantTab}
                    onChange={(k) => setVariantTab(k as "active" | "inactive")}
                />

                {isMobile ? (
                    <>
                        <List
                            dataSource={filteredVariants}
                            renderItem={(v) => {
                                const hasSale = v.sale_price != null && v.sale_price < v.price;
                                const finalPrice = hasSale ? v.sale_price! : v.price;

                                return (
                                    <List.Item className="!px-0">
                                        <div className="w-full rounded-lg border bg-white p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-sm truncate">{v.sku_variant}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {v.frame_color} · {v.frame_material} · {v.frame_shape}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <Tag color={v.is_active ? "green" : "red"}>{v.is_active ? "Đang bán" : "Ngừng bán"}</Tag>
                                                        <Tag color="blue">Tồn: {v.stock}</Tag>
                                                    </div>

                                                    <div className="mt-2">
                                                        <div className="font-semibold text-red-500">{money(finalPrice)}</div>
                                                        {hasSale ? <div className="text-xs line-through text-slate-400">{money(v.price)}</div> : null}
                                                    </div>
                                                </div>

                                                <Button
                                                    type="text"
                                                    onClick={() => {
                                                        setSheetItem(v);
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

                        <MobileActionSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            title={<span className="font-semibold">Thao tác biến thể</span>}
                        >
                            {sheetItem ? (
                                <div className="space-y-2">
                                    <Button block onClick={() => openEdit(sheetItem)}>
                                        Sửa
                                    </Button>

                                    <Button block onClick={() => openImages(sheetItem)}>
                                        Ảnh
                                    </Button>

                                    <Popconfirm
                                        title={variantTab === "active" ? "Ngừng bán biến thể" : "Xoá vĩnh viễn biến thể"}
                                        description={
                                            variantTab === "active"
                                                ? "Biến thể sẽ chuyển sang trạng thái ngừng bán."
                                                : "Hành động này xoá vĩnh viễn biến thể."
                                        }
                                        okText={variantTab === "active" ? "Ngừng bán" : "Xoá"}
                                        cancelText="Huỷ"
                                        okButtonProps={{ danger: variantTab !== "active" }}
                                        onConfirm={() => handleDeleteVariant(sheetItem._id)}
                                    >
                                        <Button block danger={variantTab !== "active"}>
                                            {variantTab === "active" ? "Ngừng bán" : "Xoá vĩnh viễn"}
                                        </Button>
                                    </Popconfirm>
                                </div>
                            ) : null}
                        </MobileActionSheet>
                    </>
                ) : (
                    <Table<VariantRow>
                        loading={loading}
                        columns={columns}
                        dataSource={filteredVariants}
                        rowKey={(r) => r._id}
                        pagination={false}
                    />
                )}
            </Card>

            <CreateVariantModal
                open={openCreateVariant}
                mode={variantModalMode}
                productId={product._id}
                variantId={variantModalMode === "edit" ? editingVariantId : null}
                onClose={() => {
                    setOpenCreateVariant(false);
                    setEditingVariantId(null);
                }}
                onSaved={() => fetchDetail()}
            />

            <VariantImagesModal
                open={openVariantImages}
                productId={product._id}
                variantId={selectedVariantId}
                onClose={() => {
                    setOpenVariantImages(false);
                    setSelectedVariantId(null);
                }}
            />
        </div>
    );
};

export default AdminVariants;
