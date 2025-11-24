// src/pages/admin/categories/CategoryModal.tsx
import { Modal, Form, Input, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";
import { AdminCategoryRow } from "../pages/AdminCategories";

interface CategoryFormValues {
    category_name: string;
    description?: string | null;
    parent_id?: string | null;
    is_active: boolean;
}

interface CategoryModalProps {
    open: boolean;
    mode: "create" | "edit";
    categories: AdminCategoryRow[]; // để chọn parent
    editingCategory?: AdminCategoryRow | null;
    onClose: () => void;
    onSaved: (cat: AdminCategoryRow) => void;
}

const CategoryModal = ({
    open,
    mode,
    categories,
    editingCategory,
    onClose,
    onSaved,
}: CategoryModalProps) => {
    const [form] = Form.useForm<CategoryFormValues>();
    const [submitting, setSubmitting] = useState(false);

    // Khi mở modal edit, set giá trị ban đầu
    useEffect(() => {
        if (open && mode === "edit" && editingCategory) {
            form.setFieldsValue({
                category_name: editingCategory.category_name,
                description: editingCategory.description ?? "",
                parent_id: editingCategory.parent_id ?? undefined,
                is_active: editingCategory.is_active,
            });
        }

        if (open && mode === "create") {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
            });
        }
    }, [open, mode, editingCategory, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload = {
                category_name: values.category_name,
                description: values.description ?? null,
                parent_id: values.parent_id || null,
                is_active: values.is_active,
            };

            if (mode === "create") {
                const res = await API.post("/admin/categories", payload);
                const created = res.data?.data;

                const newRow: AdminCategoryRow = {
                    id: created.id || created._id,
                    category_name: created.category_name,
                    slug: created.slug,
                    description: created.description ?? null,
                    parent_id: created.parent_id ?? null,
                    parent_name:
                        created.parent_id
                            ? categories.find((c) => c.id === created.parent_id)?.category_name ??
                            null
                            : null,
                    is_active: created.is_active,
                    createdAt: created.createdAt,
                };

                toast.success("Tạo danh mục thành công");
                onSaved(newRow);
            } else {
                if (!editingCategory) return;

                const res = await API.patch(
                    `/admin/categories/${editingCategory.id}`,
                    payload
                );
                const updated = res.data?.data;

                const updatedRow: AdminCategoryRow = {
                    id: updated.id || updated._id || editingCategory.id,
                    category_name: updated.category_name,
                    slug: updated.slug,
                    description: updated.description ?? null,
                    parent_id: updated.parent_id ?? null,
                    parent_name:
                        updated.parent_id
                            ? categories.find((c) => c.id === updated.parent_id)?.category_name ??
                            null
                            : null,
                    is_active: updated.is_active,
                    createdAt: updated.createdAt ?? editingCategory.createdAt,
                };

                toast.success("Cập nhật danh mục thành công");
                onSaved(updatedRow);
            }

            form.resetFields();
            onClose();
        } catch (error) {
            if (!error?.errorFields) {
                console.error(error);
                toast.error(
                    error?.response?.data?.msg ??
                    (mode === "create"
                        ? "Có lỗi khi tạo danh mục"
                        : "Có lỗi khi cập nhật danh mục")
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

    // options cho parent category (không cho chọn chính nó khi edit)
    const parentOptions = categories
        .filter((c) => (mode === "edit" && editingCategory ? c.id !== editingCategory.id : true))
        .map((c) => ({
            label: c.category_name,
            value: c.id,
        }));

    return (
        <Modal
            title={mode === "create" ? "Thêm danh mục" : "Chỉnh sửa danh mục"}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={mode === "create" ? "Tạo" : "Lưu"}
            cancelText="Huỷ"
            confirmLoading={submitting}
            maskClosable={false}
        >
            <Form<CategoryFormValues> layout="vertical" form={form}>
                <Form.Item
                    label="Tên danh mục"
                    name="category_name"
                    rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                >
                    <Input placeholder="Ví dụ: Kính râm" allowClear />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea
                        rows={3}
                        placeholder="Mô tả ngắn (optional)"
                    />
                </Form.Item>

                <Form.Item label="Danh mục cha" name="parent_id">
                    <Select
                        allowClear
                        placeholder="Chọn danh mục cha (optional)"
                        options={parentOptions}
                    />
                </Form.Item>

                <Form.Item
                    label="Trạng thái"
                    name="is_active"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Đang dùng" unCheckedChildren="Tạm ẩn" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CategoryModal;
