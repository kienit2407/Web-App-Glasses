/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Form, Input, InputNumber, Switch, Upload, message, Select } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import { FRAME_SHAPES } from "@/contants/frame-shapes";
interface Props {
    open: boolean;
    mode: "create" | "edit";
    productId: string | null;
    variantId?: string | null;
    onClose: () => void;
    onSaved?: () => void;
}

const { Dragger } = Upload;

// [SỬA 1] - Thêm hàm normFile (bộ phiên dịch)
const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
};

const CreateVariantModal = ({ open, mode, productId, variantId, onClose, onSaved }: Props) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    // [SỬA 2] - Xóa state "files" đi, Form sẽ quản lý
    // const [files, setFiles] = useState<any[]>([]);
    const fetchVariantDetail = async () => {
        if (!variantId || mode !== "edit") return;
        setLoadingDetail(true);
        try {
            const res = await API.get(`/admin/products/variants/${variantId}`);
            const v = res.data?.data;

            form.setFieldsValue({
                sku_variant: v.sku_variant,
                frame_material: v.frame_material,
                frame_color: v.frame_color,
                frame_shape: v.frame_shape,
                lens_width: v.lens_width,
                lens_height: v.lens_height,
                temple_length: v.temple_length,
                bridge_width: v.bridge_width,
                stock: v.stock,
                has_uv_protection: v.has_uv_protection,
                price: v.price,
                sale_price: v.sale_price,
                is_active: v.is_active,
            });
        } catch (e) {
            console.error(e);
            message.error("Không tải được thông tin biến thể");
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (mode === "edit") {
                fetchVariantDetail();
            } else {
                form.setFieldsValue({
                    is_active: true,
                    has_uv_protection: false,
                    stock: 0,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, variantId]);
    const uploadProps: UploadProps = {
        multiple: true,
        maxCount: 5, // Antd tự động giới hạn 5 ảnh
        listType: "picture",
        beforeUpload: (file) => {
            const okType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
            if (!okType) {
                message.error("Chỉ cho phép JPG/PNG/WebP");
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error("Ảnh phải < 5MB");
                return Upload.LIST_IGNORE;
            }
            return false; // không auto upload
        },
        // [SỬA 3] - Xóa onChange này, Form sẽ tự xử lý
        // onChange: ({ fileList }) => setFiles(fileList),
    };

    const handleOk = async () => {
        if (!productId) return;

        setSubmitting(true);
        try {
            const values = await form.validateFields();

            const body = {
                sku_variant: values.sku_variant,
                frame_material: values.frame_material,
                frame_color: values.frame_color,
                frame_shape: values.frame_shape,
                lens_width: values.lens_width,
                lens_height: values.lens_height,
                temple_length: values.temple_length,
                bridge_width: values.bridge_width,
                stock: Number(values.stock || 0),
                has_uv_protection: !!values.has_uv_protection,
                price: Number(values.price),
                sale_price: values.sale_price ? Number(values.sale_price) : null,
                is_active: !!values.is_active,
            };

            if (mode === "create") {
                // --- TẠO + UPLOAD ẢNH như bạn đang làm ---
                const files = values.images as UploadFile[];
                const { data } = await API.post(
                    `/admin/products/${productId}/variants`,
                    body
                );
                const variantId = data.data._id;

                const fd = new FormData();
                files.forEach((f) => {
                    fd.append("images", f.originFileObj as File);
                });

                try {
                    await API.post(
                        `/admin/products/${productId}/variants/${variantId}/images`,
                        fd
                    );
                } catch (e) {
                    await API.delete(`/admin/products/variants/${variantId}`);
                    throw e;
                }

                message.success("Tạo biến thể thành công");
            } else {
                // --- EDIT ---
                if (!variantId) {
                    message.error("Thiếu variantId");
                    return;
                }
                await API.patch(`/admin/products/variants/${variantId}`, body);
                message.success("Cập nhật biến thể thành công");
            }

            form.resetFields();
            onSaved?.();
            onClose();
        } catch (e: any) {
            console.error(e);
            if (e.errorFields) {
                message.error("Dữ liệu không hợp lệ, vui lòng kiểm tra lại");
            } else {
                message.error(e?.response?.data?.msg || "Lỗi khi lưu biến thể");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // [SỬA 8] - Sửa hàm Cancel
    const handleCancel = () => {
        form.resetFields(); // Reset cả file (vì Form quản lý)
        // setFiles([]); // Xóa
        onClose();
    };

    return (
        <Modal
            title="Thêm biến thể"
            open={open}
            onCancel={handleCancel} // Gắn hàm mới
            onOk={handleOk}
            confirmLoading={submitting}
            okText={mode === "create" ? "Tạo" : "Lưu"}
            cancelText="Huỷ"
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ is_active: true, has_uv_protection: false }}
            >
                {/* ... (Tất cả Form.Item khác giữ nguyên) ... */}
                <Form.Item
                    name="sku_variant"
                    label="SKU"
                    rules={[{ required: true, message: "Nhập SKU" }]}
                >
                    <Input placeholder="VD: RB-AVT-BLK-55" />
                </Form.Item>

                <Form.Item label="Thuộc tính khung">
                    <Input.Group compact>
                        <Form.Item
                            name="frame_material"
                            noStyle
                            rules={[{ required: true, message: "Chất liệu?" }]}
                        >
                            <Input style={{ width: "33%" }} placeholder="Chất liệu" />
                        </Form.Item>
                        <Form.Item
                            name="frame_color"
                            noStyle
                            rules={[{ required: true, message: "Màu?" }]}
                        >
                            <Input style={{ width: "33%" }} placeholder="Màu" />
                        </Form.Item>
                        <Form.Item
                            name="frame_shape"
                            noStyle
                            rules={[{ required: true, message: "Dáng?" }]}
                        >
                            <Select
                                style={{ width: "34%" }}
                                placeholder="Dáng khung"
                                options={FRAME_SHAPES.map((s) => ({
                                    value: s.value,
                                    label: s.label,
                                }))}
                            />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                <Form.Item label="Kích thước">
                    <Input.Group compact>
                        <Form.Item name="lens_width" noStyle rules={[{ required: true }]}>
                            <Input style={{ width: "25%" }} placeholder="Lens width" />
                        </Form.Item>
                        <Form.Item name="lens_height" noStyle rules={[{ required: true }]}>
                            <Input style={{ width: "25%" }} placeholder="Lens height" />
                        </Form.Item>
                        <Form.Item name="temple_length" noStyle rules={[{ required: true }]}>
                            <Input style={{ width: "25%" }} placeholder="Temple length" />
                        </Form.Item>
                        <Form.Item name="bridge_width" noStyle rules={[{ required: true }]}>
                            <Input style={{ width: "25%" }} placeholder="Bridge width" />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                <Form.Item label="Giá & tồn kho">
                    <Input.Group compact>
                        <Form.Item
                            name="price"
                            noStyle
                            rules={[{ required: true, message: "Nhập giá niêm yết" }]}
                        >
                            <InputNumber
                                style={{ width: "33%" }}
                                min={0}
                                placeholder="Giá niêm yết (gốc)"
                            />
                        </Form.Item>

                        <Form.Item name="sale_price" noStyle>
                            <InputNumber
                                style={{ width: "33%" }}
                                min={0}
                                placeholder="Giá khuyến mãi (tuỳ chọn)"
                            />
                        </Form.Item>

                        <Form.Item name="stock" noStyle initialValue={0}>
                            <InputNumber
                                style={{ width: "34%" }}
                                min={0}
                                placeholder="Tồn kho"
                            />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>


                <div className="flex gap-20">
                    <Form.Item name="is_active" label="Mở bán" valuePropName="checked">
                        <Switch checkedChildren="Đang bán" unCheckedChildren="Tạm ẩn" />
                    </Form.Item>
                    <Form.Item name="has_uv_protection" label="Bảo vệ UV" valuePropName="checked">
                        <Switch checkedChildren="Có UV" unCheckedChildren="Không có UV" />
                    </Form.Item>
                </div>
                {/* CHỈ hiển thị upload ảnh khi CREATE */}
                {mode === "create" && (
                    <Form.Item
                        name="images"
                        label="Ảnh biến thể (kéo-thả, tối đa 5)"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[
                            {
                                validator: (_, value: UploadFile[]) => {
                                    const files = value || [];
                                    if (files.length === 0) {
                                        return Promise.reject(
                                            new Error("Biến thể phải có ít nhất 1 ảnh")
                                        );
                                    }
                                    if (files.length > 5) {
                                        return Promise.reject(
                                            new Error("Chỉ được chọn tối đa 5 ảnh")
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                Kéo thả hoặc bấm để chọn ảnh
                            </p>
                            <p className="ant-upload-hint">
                                JPG/PNG/WebP • Tối đa 5 ảnh
                            </p>
                        </Dragger>
                    </Form.Item>
                )}

            </Form>
        </Modal>
    );
};

export default CreateVariantModal;