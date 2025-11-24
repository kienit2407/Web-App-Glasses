/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/brands/BrandModal.tsx
import { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { API } from "@/app/lib/axios-client";
import type { GetProp, UploadProps, UploadFile } from "antd";
type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

interface BrandFormValues {
    brand_name: string;
    description?: string | null;
    logo?: UploadFile[];
    is_active: boolean;
}

interface BrandModalProps {
    open: boolean;
    mode: "create" | "edit";
    editingBrand?: {
        id: string;
        brand_name: string;
        slug: string;
        description?: string | null;
        logo_url?: string | null;
        is_active: boolean;
        createdAt: string;
    } | null;
    onClose: () => void;
    onSaved: (brand: any) => void; // có thể typed lại sau
}

const BrandModal = ({
    open,
    mode,
    editingBrand,
    onClose,
    onSaved,
}: BrandModalProps) => {
    const [form] = Form.useForm<BrandFormValues>();
    const [submitting, setSubmitting] = useState(false);

    // ================== Upload config ==================
    const beforeUpload = (file: FileType) => {
        const isImage =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/webp";

        if (!isImage) {
            message.error("Chỉ cho phép ảnh JPG/PNG/WebP");
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Ảnh phải nhỏ hơn 2MB");
            return Upload.LIST_IGNORE;
        }

        return false; // không auto upload, mình upload khi submit
    };

    const uploadButton = (
        <button type="button" style={{ border: 0, background: "none" }}>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải logo</div>
        </button>
    );

    const normFile = (e: any) => {
        if (Array.isArray(e)) return e;
        return e?.fileList;
    };

    // ================== Init form khi mở modal ==================
    useEffect(() => {
        if (open && mode === "edit" && editingBrand) {
            // Tạo fileList giả cho Upload nếu đã có logo_url
            const logoFileList: UploadFile[] = editingBrand.logo_url
                ? [{
                    uid: "-1",
                    name: "logo",
                    status: "done",
                    url: editingBrand.logo_url,
                }]
                : [];

            form.setFieldsValue({
                brand_name: editingBrand.brand_name,
                description: editingBrand.description ?? "",
                is_active: editingBrand.is_active,
                logo: logoFileList,
            });
        }

        if (open && mode === "create") {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
                logo: [],
            });
        }
    }, [open, mode, editingBrand, form]);

    // ================== Submit ==================
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const formData = new FormData();
            formData.append("brand_name", values.brand_name);
            formData.append("description", values.description ?? "");
            formData.append("is_active", values.is_active ? "true" : "false");

            const fileList = values.logo as UploadFile[] | undefined;
            if (fileList && fileList.length > 0) {
                const f0 = fileList[0];
                if (f0.originFileObj) {
                    // chỉ khi user chọn logo mới thì mới append
                    formData.append("logo", f0.originFileObj as File);
                }
            }
            if (mode === "create") {
                const res = await API.post("/admin/brands", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                const created = res.data?.data;
                message.success("Tạo thương hiệu thành công");
                onSaved(created);
            } else {
                if (!editingBrand) return;

                const res = await API.patch(
                    `/admin/brands/${editingBrand.id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const updated = res.data?.data;
                message.success("Cập nhật thương hiệu thành công");
                onSaved(updated);
            }

            form.resetFields();
            onClose();
        } catch (err: any) {
            if (!err?.errorFields) {
                console.error(err);
                message.error(
                    err?.response?.data?.msg ??
                    (mode === "create"
                        ? "Có lỗi khi tạo thương hiệu"
                        : "Có lỗi khi cập nhật thương hiệu")
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
            title={mode === "create" ? "Thêm thương hiệu" : "Chỉnh sửa thương hiệu"}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={mode === "create" ? "Tạo" : "Lưu"}
            cancelText="Huỷ"
            confirmLoading={submitting}
            maskClosable={false}
        >
            <Form<BrandFormValues> layout="vertical" form={form}>
                <Form.Item
                    label="Tên thương hiệu"
                    name="brand_name"
                    rules={[{ required: true, message: "Vui lòng nhập tên thương hiệu" }]}
                >
                    <Input placeholder="Ví dụ: Rayban" allowClear />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea
                        rows={3}
                        placeholder="Mô tả ngắn về thương hiệu (optional)"
                    />
                </Form.Item>

                <Form.Item
                    label="Logo thương hiệu"
                    name="logo"
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

                <Form.Item
                    label="Trạng thái"
                    name="is_active"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Tạm ẩn" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default BrandModal;
