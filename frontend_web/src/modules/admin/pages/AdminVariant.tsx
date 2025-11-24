/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Breadcrumb, Card, Table, Button, Tag, Space, Skeleton, Popconfirm, Tabs } from "antd";
import type { TableProps } from "antd";
import { API } from "@/app/lib/axios-client";
import CreateVariantModal from "../components/VariantModal";
import { ArrowLeftRight, MoveLeft } from "lucide-react";
import { toast } from "sonner";
import VariantImagesModal from "../components/VariantImagesModal";
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
    sale_price?: number
    stock: number;
    is_active: boolean;
}

interface ProductDetailResponse {
    product: ProductDetail;
    variants: VariantRow[];
}



const AdminProductDetail = () => {
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
    const handleDeleteVariant = async (variantId: string) => {
        try {
            if (variantTab === "active") {
                // Xoá mềm: ngừng bán
                await API.delete(`/admin/products/variants/${variantId}`);
                toast.success("Đã ngừng bán biến thể");
            } else {
                // Tab inactive: cố gắng xoá cứng
                await API.delete(`/admin/products/variants/${variantId}`, {
                    params: { force: true },
                });
                toast.success("Đã xoá vĩnh viễn biến thể");
            }

            // Reload lại danh sách variant
            fetchDetail();
        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.msg ||
                (variantTab === "active"
                    ? "Không thể ngừng bán biến thể"
                    : "Không thể xoá vĩnh viễn biến thể")
            );
        }
    };
    const columns: TableProps<VariantRow>["columns"] = [
        {
            title: "SKU",
            dataIndex: "sku_variant",
            key: "sku_variant"
        },
        {
            title: "Màu",
            dataIndex: "frame_color",
            key: "frame_color"
        },
        {
            title: "Chất liệu",
            dataIndex: "frame_material",
            key: "frame_material"
        },
        {
            title: "Dáng kính",
            dataIndex: "frame_shape",
            key: "frame_shape"
        },
        {
            title: "Giá",
            key: "price",
            render: (_: any, record: VariantRow) => {
                const hasSale =
                    record.sale_price != null && record.sale_price < record.price;

                const finalPrice = hasSale ? record.sale_price! : record.price;
                const crossed = hasSale ? record.price : null;

                return (
                    <div className="space-y-0.5">
                        <div className="font-medium text-red-500">
                            {finalPrice.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            })}
                        </div>
                        {crossed && (
                            <div className="text-xs line-through text-slate-400">
                                {crossed.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                })}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock"
        },
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
                    >Sửa
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
                        title="Xoá biến thể"
                        description="Bạn có chắc muốn xoá biến thể này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteVariant(record._id)}
                    >
                        {variantTab === 'inactive'
                            && <Button
                                color="danger"
                                variant="filled"
                            >
                                Xoá
                            </Button>}
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Gọi 2 API song song
            const [productRes, variantsRes] = await Promise.all([
                API.get(`/admin/products/${id}`),         // API 1: Lấy thông tin product
                API.get(`/admin/products/${id}/variants`) // API 2: Lấy danh sách variants
            ]);

            // Tự gộp data lại theo đúng cấu trúc `ProductDetailResponse`
            setData({
                // (Giả sử product nằm trong res.data.data.product hoặc res.data.data)
                product: productRes.data?.data?.product || productRes.data?.data,
                // (Giả sử variants nằm trong res.data.data.items hoặc res.data.data)
                variants: variantsRes.data?.data?.items || variantsRes.data?.data || []
            });

        } catch (err) {
            console.error("Lỗi khi tải chi tiết sản phẩm:", err);
            toast.error("Không thể tải dữ liệu");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetail(); }, [id]);

    if (loading || !data) return <Skeleton active />;

    const { product, variants } = data;
    const filteredVariants = variants.filter(v =>
        variantTab === "active" ? v.is_active : !v.is_active
    );

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
                <Button
                    onClick={() => nav(-1)}>
                    <MoveLeft />
                    Quay lại
                </Button>
            </div>

            <Card
                title={
                    <div className="flex items-center justify-between">
                        <span>Biến thể của: <b>{product.product_name}</b> <span className="text-slate-400">/{product.slug}</span></span>
                        <Button type="primary" onClick={
                            () => {
                                setVariantModalMode("create");
                                setEditingVariantId(null);
                                setOpenCreateVariant(true);
                            }}
                        >Thêm biến thể</Button>
                    </div>
                }
            >
                <Tabs
                    items={[
                        { key: "active", label: "Đang bán" },
                        { key: "inactive", label: "Ngừng bán" },
                    ]}
                    activeKey={variantTab}
                    onChange={k => setVariantTab(k as "active" | "inactive")}
                />
                <Table<VariantRow>
                    loading={loading}
                    columns={columns}
                    dataSource={filteredVariants}
                    rowKey={(r) => r._id}
                    pagination={false}
                />
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
                onSaved={() => {
                    fetchDetail();
                }}
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

export default AdminProductDetail;
