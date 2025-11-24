// src/pages/admin/promotions/PromotionModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    DatePicker,
    InputNumber,
    Upload,
    message,
    Switch,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs"; // 👈 dùng trực tiếp
import { API } from "@/app/lib/axios-client";
import { PlusOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export interface AdminPromotionRow {
    id: string;
    title: string;
    description?: string | null;
    banner_url?: string | null;
    is_active: boolean;
    start_date: string;
    end_date: string;
    priority: number;
    discount_type: "percent" | "fixed";
    discount_value: number;
    max_discount?: number | null;
    min_order?: number | null;
    createdAt: string;
}

interface PromotionModalProps {
    open: boolean;
    mode: "create" | "edit";
    promotion?: AdminPromotionRow | null;
    onClose: () => void;
    onSaved: () => void;
}

interface FormValues {
    title: string;
    description?: string;
    dateRange: [Dayjs, Dayjs];
    is_active: boolean;
    priority?: number;

    discount_type: "percent" | "fixed";
    discount_value: number;
    max_discount?: number;
    min_order?: number;
}

const PromotionModal = ({
    open,
    mode,
    promotion,
    onClose,
    onSaved,
}: PromotionModalProps) => {
    const [form] = Form.useForm<FormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Khi mở modal edit -> fill dữ liệu
    useEffect(() => {
        if (open && mode === "edit" && promotion) {
            const start = promotion.start_date ? dayjs(promotion.start_date) : undefined;
            const end = promotion.end_date ? dayjs(promotion.end_date) : undefined;

            form.setFieldsValue({
                title: promotion.title,
                description: promotion.description ?? "",
                dateRange: start && end ? [start, end] : undefined,
                is_active: promotion.is_active,
                priority: promotion.priority,

                discount_type: promotion.discount_type,
                discount_value: promotion.discount_value,
                max_discount: promotion.max_discount ?? undefined,
                min_order: promotion.min_order ?? undefined,
            });

            if (promotion.banner_url) {
                setFileList([
                    {
                        uid: "-1",
                        name: "banner",
                        status: "done",
                        url: promotion.banner_url,
                    },
                ]);
            } else {
                setFileList([]);
            }
        }

        if (open && mode === "create") {
            form.resetFields();
            setFileList([]);
            form.setFieldsValue({
                is_active: true,
                discount_type: "percent",
            });
        }
    }, [open, mode, promotion, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (!values.dateRange || values.dateRange.length !== 2) {
                message.error("Vui lòng chọn thời gian áp dụng");
                return;
            }

            const [start, end] = values.dateRange;
            
            if (mode === "create" && !fileList[0]) {
                message.error("Vui lòng tải lên banner cho khuyến mãi");
                return;
            }
            const formData = new FormData();
            formData.append("title", values.title);
            if (values.description) {
                formData.append("description", values.description);
            }
            formData.append("start_date", start.toISOString());
            formData.append("end_date", end.toISOString());
            formData.append("is_active", values.is_active ? "true" : "false");
            if (values.priority != null) {
                formData.append("priority", String(values.priority));
            }

            // 👇 thêm discount fields
            formData.append("discount_type", values.discount_type);
            formData.append("discount_value", String(values.discount_value));
            if (values.max_discount != null) {
                formData.append("max_discount", String(values.max_discount));
            }
            if (values.min_order != null) {
                formData.append("min_order", String(values.min_order));
            }

            const file = fileList[0];
            if (file && file.originFileObj) {
                formData.append("banner", file.originFileObj);
            }

            setSubmitting(true);

            if (mode === "create") {
                await API.post("/admin/promotions", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                message.success("Tạo khuyến mãi thành công");
            } else if (mode === "edit" && promotion) {
                await API.patch(`/admin/promotions/${promotion.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                message.success("Cập nhật khuyến mãi thành công");
            }

            onSaved();
            onClose();
        } catch (err: any) {
            if (err?.errorFields) return;
            console.error(err);
            const msg = err?.response?.data?.msg || "Không thể lưu khuyến mãi";
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const uploadButton = (
        <button type="button" style={{ border: 0, background: "none" }}>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh</div>
        </button>
    );

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Tạo khuyến mãi" : "Chỉnh sửa khuyến mãi"}
            onCancel={handleCancel}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
            confirmLoading={submitting}
            destroyOnClose
        >
            <Form<FormValues>
                form={form}
                layout="vertical"
                initialValues={{
                    is_active: true,
                }}
            >
                <Form.Item
                    label="Tiêu đề"
                    name="title"
                    rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                >
                    <Input placeholder="VD: Giảm 20% Dior" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <TextArea rows={3} placeholder="Mô tả ngắn về chương trình" />
                </Form.Item>

                {/* ==== Banner upload ==== */}
                <Form.Item
                    rules={[
                        {
                            validator: (_, value: UploadFile[]) => {
                                const files = value || [];
                                if (files.length === 0) {
                                    return Promise.reject(
                                        new Error("Sản phẩm phải có đúng 1 banner")
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
                    label="Banner khuyến mãi ">
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        maxCount={1}
                        beforeUpload={(file) => {
                            const isImage =
                                file.type === "image/jpeg" ||
                                file.type === "image/png" ||
                                file.type === "image/webp";
                            if (!isImage) {
                                message.error("Chỉ cho phép JPG/PNG/WebP");
                                return Upload.LIST_IGNORE;
                            }
                            const isLt5M = file.size / 1024 / 1024 < 5;
                            if (!isLt5M) {
                                message.error("Ảnh phải nhỏ hơn 5MB");
                                return Upload.LIST_IGNORE;
                            }
                            return false; // không auto upload
                        }}
                        onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                    >
                        {fileList.length >= 1 ? null : uploadButton}
                    </Upload>
                </Form.Item>

                {/* ==== Discount block ==== */}
                <Form.Item
                    label="Loại giảm giá"
                    name="discount_type"
                    rules={[{ required: true, message: "Chọn loại giảm giá" }]}
                >
                    <select
                        className="ant-input"
                        onChange={(e) =>
                            form.setFieldValue("discount_type", e.target.value as "percent" | "fixed")
                        }
                        value={form.getFieldValue("discount_type")}
                    >
                        <option value="percent">Giảm theo %</option>
                        <option value="fixed">Giảm số tiền cố định</option>
                    </select>
                </Form.Item>

                <Form.Item
                    label="Giá trị giảm"
                    name="discount_value"
                    rules={[{ required: true, message: "Nhập giá trị giảm" }]}
                >
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Giảm tối đa (tuỳ chọn)" name="max_discount">
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Đơn tối thiểu (tuỳ chọn)" name="min_order">
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Thời gian áp dụng"
                    name="dateRange"
                    rules={[{ required: true, message: "Vui lòng chọn thời gian áp dụng" }]}
                >
                    <RangePicker
                        showTime={false}
                        style={{ width: "100%" }}
                        format="YYYY-MM-DD"
                    />
                </Form.Item>

                <Form.Item label="Độ ưu tiên (số càng lớn càng ưu tiên)" name="priority">
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PromotionModal;
