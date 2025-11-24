/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Modal,
    Form,
    Input,
    Select,
    Upload,
    message,
    Row,
    Col,
    notification,
    Space,
    Button,
    Switch,
} from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";

export interface CreateProductPayload {
    product_name: string;
    description: string;
    category_id: string;
    brand_id: string;
    origin_country: string;
    tags?: string[];
    is_active: boolean;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

interface CategoryOption {
    id: string;
    category_name: string;
}

interface BrandOption {
    id: string;
    brand_name: string;
}

type Mode = "create" | "edit";

interface ProductModalProps {
    open: boolean;
    mode: Mode;
    productId?: string | null;
    onClose: () => void;
    onSaved?: (product: any) => void;
}

const ProductModal = ({ open, mode, productId, onClose, onSaved }: ProductModalProps) => {
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [variantCount, setVariantCount] = useState(0);
    const navigate = useNavigate();

    const beforeUpload = (file: FileType) => {
        const isImage =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/webp";

        if (!isImage) {
            message.error("Chỉ cho phép ảnh JPG/PNG/WebP");
            return Upload.LIST_IGNORE;
        }

        return false; // không auto upload
    };

    const uploadButton = (
        <button type="button" style={{ border: 0, background: "none" }}>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh</div>
        </button>
    );

    const normFile = (e: any) => {
        if (Array.isArray(e)) return e;
        return e?.fileList;
    };

    // 1) Load categories / brands
    const fetchMeta = async () => {
        try {
            setLoadingMeta(true);
            const [catRes, brandRes] = await Promise.all([
                API.get("/admin/categories", { params: { page: 1, limit: 100 } }),
                API.get("/admin/brands", { params: { page: 1, limit: 100 } }),
            ]);

            const catData = catRes.data?.data?.items ?? [];
            const brandData = brandRes.data?.data?.items ?? [];

            setCategories(
                catData.map((c: any) => ({
                    id: c.id || c._id,
                    category_name: c.category_name,
                }))
            );
            setBrands(
                brandData.map((b: any) => ({
                    id: b.id || b._id,
                    brand_name: b.brand_name,
                }))
            );
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.msg ?? "Lỗi khi tải danh mục / thương hiệu"
            );
        } finally {
            setLoadingMeta(false);
        }
    };

    // 2) Load detail product khi edit
    const fetchDetail = async () => {
        if (!productId || mode !== "edit") return;
        setLoadingDetail(true);
        try {
            const res = await API.get(`/admin/products/${productId}`);
            const data = res.data?.data?.product || res.data?.data;
            const variantCount = res.data?.data?.variant_count
            if (!data) return;
            const thumbFileList: UploadFile[] = data.thumbnail_url
                ? [{
                    uid: "-1",
                    name: "thumbnail",
                    status: "done",
                    url: data.thumbnail_url,
                }]
                : [];
            console.log("metadata:", data.variant_count)
            setVariantCount(variantCount ?? 0)
            form.setFieldsValue({
                product_name: data.product_name,
                description: data.description,
                category_id: data.category_id,
                brand_id: data.brand_id,
                origin_country: data.origin_country,
                tags: data.tags ?? [],
                for_gender: data.for_gender,
                is_active: data.is_active,
                thumbnail_url: thumbFileList
            });


        } catch (err: any) {
            console.error(err);
            message.error("Không tải được thông tin sản phẩm");
        } finally {
            setLoadingDetail(false);
        }
    };

    // Khi mở modal
    useEffect(() => {
        if (open) {
            fetchMeta();

            if (mode === "create") {
                form.resetFields();
                form.setFieldsValue({
                    is_active: true,
                    thumbnail_url: []
                });
            } else if (mode === "edit") {
                fetchDetail();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, productId]);

    const handleOk = async () => {
        setSubmitting(true);
        try {
            const values = await form.validateFields();
            const currentFileList = values.thumbnail_url as UploadFile[] | undefined;

            const formData = new FormData();
            formData.append("product_name", values.product_name);
            formData.append("description", values.description);
            formData.append("category_id", values.category_id);
            formData.append("brand_id", values.brand_id);
            formData.append("origin_country", values.origin_country);
            formData.append("is_active", String(!!values.is_active));
            formData.append("for_gender", values.for_gender);

            if (values.tags && values.tags.length > 0) {
                formData.append("tags", JSON.stringify(values.tags));
            }

            // Nếu có file mới (originFileObj) thì append "thumbnail"
            if (currentFileList && currentFileList.length > 0) {
                const f0 = currentFileList[0];
                if (f0.originFileObj) {
                    formData.append("thumbnail", f0.originFileObj as File);
                }
            }

            if (mode === "create") {
                // Với sản phẩm mới → luôn là nháp (is_active=false) như bạn đang làm
                formData.set("is_active", "false");

                const res = await API.post("/admin/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                const product = res.data?.data;

                notification.success({
                    message: "Tạo sản phẩm thành công",
                    description:
                        "Bạn có thể thêm biến thể ngay hoặc mở trang chi tiết sản phẩm.",
                    duration: 5,
                    btn: (
                        <Space>
                            <Button
                                size="small"
                                onClick={() => {
                                    navigate(`/admin/products/${product.id || product._id}`);
                                }}
                            >
                                Mở chi tiết
                            </Button>
                            <Button
                                size="small"
                                type="primary"
                                onClick={() => {
                                    onSaved?.(product);
                                    notification.destroy();
                                }}
                            >
                                Thêm biến thể
                            </Button>
                        </Space>
                    ),
                });

                onSaved?.(product);
            } else {
                if (!productId) return;

                const res = await API.patch(
                    `/admin/products/${productId}`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );

                const updated = res.data?.data;
                message.success("Cập nhật sản phẩm thành công");
                onSaved?.(updated);
            }

            form.resetFields();
            onClose();
        } catch (err: any) {
            // nếu là lỗi validate Form thì antd đã hiển thị, không toast thêm
            if (!err?.errorFields) {
                console.error(err);
                message.error(
                    err?.response?.data?.msg ||
                    (mode === "create"
                        ? "Có lỗi khi tạo sản phẩm"
                        : "Có lỗi khi cập nhật sản phẩm")
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (submitting) return;
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={mode === "create" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}
            open={open}
            maskClosable={false}
            onOk={handleOk}
            mask={true}
            onCancel={handleCancel}
            okText={mode === "create" ? "Tạo" : "Lưu"}
            keyboard={false}
            cancelText="Huỷ"
            confirmLoading={submitting || loadingDetail}
        >
            <Form
                layout="vertical"
                form={form}
                initialValues={{
                    is_active: true,
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Tên sản phẩm"
                            name="product_name"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên sản phẩm" },
                            ]}
                        >
                            <Input
                                allowClear
                                placeholder="Ví dụ: Kính râm Aviator Classic"
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Đối tượng"
                            name="for_gender"
                            rules={[{ required: true, message: "Vui lòng chọn đối tượng" }]}
                        >
                            <Select
                                placeholder="Chọn đối tượng"
                                options={[
                                    { label: "Nam", value: "male" },
                                    { label: "Nữ", value: "female" },
                                    { label: "Unisex", value: "unisex" },
                                    { label: "Trẻ em", value: "kids" },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Danh mục"
                            name="category_id"
                            rules={[
                                { required: true, message: "Vui lòng chọn danh mục" },
                            ]}
                        >
                            <Select
                                placeholder="Chọn danh mục"
                                loading={loadingMeta}
                                options={categories.map((c) => ({
                                    label: c.category_name,
                                    value: c.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Thương hiệu"
                            name="brand_id"
                            rules={[
                                { required: true, message: "Vui lòng chọn thương hiệu" },
                            ]}
                        >
                            <Select
                                placeholder="Chọn thương hiệu"
                                loading={loadingMeta}
                                options={brands.map((b) => ({
                                    label: b.brand_name,
                                    value: b.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Xuất xứ"
                    name="origin_country"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên xuất xứ" },
                    ]}
                >
                    <Input allowClear placeholder="Ví dụ: Nhật Bản" />
                </Form.Item>

                <Form.Item
                    rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                    label="Mô tả"
                    name="description"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Mô tả ngắn về sản phẩm"
                    />
                </Form.Item>

                <Form.Item
                    rules={[{ required: true, message: "Vui lòng nhập tags" }]}
                    label="Tags"
                    name="tags"
                >
                    <Select mode="tags" placeholder="Nhập tag và bấm Enter" />
                </Form.Item>
                {mode === "edit" && (
                    <Form.Item
                        label="Đăng bán"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Đang bán" unCheckedChildren="Tạm ẩn" disabled={variantCount === 0} />
                    </Form.Item>
                )}
                {mode === "edit" && variantCount === 0 && (
                    <div className="text-xs text-red-500 mb-2 -mt-2">
                        Cần tạo ít nhất 1 biến thể trước khi bật "Đang bán".
                    </div>
                )}
                <Form.Item
                    label="Thumbnail sản phẩm"
                    name="thumbnail_url"
                    rules={[
                        {
                            validator: (_, value: UploadFile[]) => {
                                const files = value || [];
                                if (files.length === 0) {
                                    return Promise.reject(
                                        new Error("Sản phẩm phải có đúng 1 ảnh thumbnail")
                                    );
                                }
                                if (files.length > 1) {
                                    return Promise.reject(
                                        new Error("Chỉ được chọn 1 ảnh thumbnail")
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                >
                    <Upload

                        listType="picture-card"
                        beforeUpload={beforeUpload}
                        maxCount={1}
                    >
                        {uploadButton}
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ProductModal;
