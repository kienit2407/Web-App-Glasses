/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect } from "react";
import { Modal, Form, Input, Switch } from "antd";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";
import { AdminUserRow } from "../pages/AdminUser";

type Mode = "create" | "edit";

interface AdminUserModalProps {
    open: boolean;
    mode: Mode;
    editingUser?: AdminUserRow;
    onClose: () => void;
    onSaved: (user: AdminUserRow) => void;
}

const AdminUserModal: FC<AdminUserModalProps> = ({
    open,
    mode,
    editingUser,
    onClose,
    onSaved,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (mode === "edit" && editingUser) {
            form.setFieldsValue({
                email: editingUser.email,
                display_name: editingUser.display_name,
                // admin nếu roles có "admin"
                is_admin: editingUser.roles.includes("admin"),
                is_active: editingUser.is_active,
            });
        } else if (mode === "create") {
            form.resetFields();
            form.setFieldsValue({
                is_admin: false,
                is_active: true,
            });
        }
    }, [mode, editingUser, form, open]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (mode === "create") {
                // Tạo user mới
                // Quy ước: nếu is_admin = true -> roles = ['admin'], BE sẽ tự thêm 'user'
                const payload = {
                    email: values.email,
                    display_name: values.display_name,
                    password: values.password,
                    roles: [values.role],
                    is_active: values.is_active,
                };

                const res = await API.post("/admin/users", payload);
                const user: AdminUserRow = res.data.data;

                toast.success("Tạo user thành công");
                onSaved(user);
                onClose();
            } else if (mode === "edit" && editingUser) {
                // Cập nhật role (và có thể sau này cập nhật thêm tên / active nếu muốn)
                const payload = {
                    is_admin: values.is_admin as boolean,
                    // nếu muốn dùng roles array:
                    // roles: values.is_admin ? ["admin"] : ["user"],
                };

                const res = await API.patch(
                    `/admin/users/${editingUser._id}/role`,
                    payload
                );
                const user: AdminUserRow = res.data.data;

                toast.success("Cập nhật vai trò thành công");
                onSaved(user);
                onClose();
            }
        } catch (err: any) {
            if (err?.errorFields) {
                // lỗi validate form, bỏ qua
                return;
            }
            console.error(err);
            toast.error(err?.response?.data?.msg ?? "Có lỗi xảy ra");
        }
    };

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Tạo user thủ công" : "Chỉnh sửa vai trò user"}
            onCancel={onClose}
            onOk={handleOk}
            okText={mode === "create" ? "Tạo user" : "Lưu thay đổi"}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "Email là bắt buộc" },
                        { type: "email", message: "Email không hợp lệ" },
                    ]}
                >
                    <Input disabled={mode === "edit"} />
                </Form.Item>

                <Form.Item
                    label="Tên hiển thị"
                    name="display_name"
                    rules={[{ required: true, message: "Tên hiển thị là bắt buộc" }]}
                >
                    <Input />
                </Form.Item>

                {mode === "create" && (
                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            { required: true, message: "Mật khẩu là bắt buộc" },
                            { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                )}

                <Form.Item
                    label="Đặt làm admin"
                    name="is_admin"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Admin" unCheckedChildren="User"/>
                </Form.Item>

                <Form.Item
                    label="Đang hoạt động?"
                    name="is_active"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AdminUserModal;
