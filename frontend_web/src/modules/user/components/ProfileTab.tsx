/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/user/account/ProfileTab.tsx
import { useEffect, useState } from "react"
import { Form, Input, Button, Upload, Typography, Space, Divider } from "antd"
import { UploadOutlined } from "@ant-design/icons"
import { API } from "@/app/lib/axios-client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const { Title, Text } = Typography

export const ProfileTab = () => {
    const { user, fetchMe } = useAuth()
    const [form] = Form.useForm()
    const [pwdForm] = Form.useForm()
    const [avatarUploading, setAvatarUploading] = useState(false)
    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
    }
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                email: user.email,
                display_name: user.display_name,
            })
        }
    }, [user])

    const handleProfileSubmit = async (values: any) => {
        try {
            await API.patch("/users/me", {
                display_name: values.display_name,
            })
            toast.success("Cập nhật hồ sơ thành công")
            await fetchMe()
        } catch (err: any) {
            console.error(err)
            toast.error(err?.response?.data?.msg || "Không thể cập nhật hồ sơ")
        }
    }

    const handleUploadAvatar = async ({ file }: any) => {
        if (!file) return

        setAvatarUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file)

            // PATCH /users/me gửi file trực tiếp
            const res = await API.patch("/users/me", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            toast.success("Cập nhật avatar thành công")
            await fetchMe()
        } catch (err) {
            toast.error("Không thể cập nhật avatar")
        } finally {
            setAvatarUploading(false)
        }
    }

    const handleChangePassword = async (values: any) => {
        try {
            await API.patch("/users/me/password", {
                current_password: values.current_password,
                new_password: values.new_password,
                confirm_password: values.confirm_password,
            })
            toast.success("Đổi mật khẩu thành công")
            pwdForm.resetFields()
        } catch (err: any) {
            console.error(err)
            toast.error(err?.response?.data?.msg || "Không thể đổi mật khẩu")
        }
    }

    return (
        <div>
            <Title level={4}>Hồ sơ của tôi</Title>
            <Text type="secondary">
                Quản lý thông tin hồ sơ và bảo mật tài khoản
            </Text>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-12">
                {/* FORM THÔNG TIN */}
                <Form
                    form={form}
                    layout="vertical"
                    className="max-w-lg"
                    onFinish={handleProfileSubmit}
                >
                    <Form.Item label="Email" name="email">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item
                        label="Tên hiển thị"
                        name="display_name"
                        rules={[{ required: true, message: "Nhập tên hiển thị" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Button type="primary" htmlType="submit">
                        Lưu thay đổi
                    </Button>
                </Form>

                {/* AVATAR */}
                <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4">

                    <Avatar className="h-24 w-24 rounded-full border shadow-sm">
                        <AvatarImage
                            src={user?.avatar_url || ""}
                            alt={user?.display_name}
                            className="object-cover"
                        />
                        <AvatarFallback
                            className="text-2xl"
                        >{getInitials(user?.display_name)}</AvatarFallback>
                    </Avatar>
                    <Space direction="vertical" className="items-center">
                        <Upload
                            showUploadList={false}
                            customRequest={handleUploadAvatar}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={avatarUploading}>
                                Thay đổi avatar
                            </Button>
                        </Upload>

                        <Text type="secondary" className="text-xs">
                            Dung lượng ít hơn 2MB, định dạng: JPG, PNG
                        </Text>
                    </Space>

                    <Divider />

                    {/* Đổi mật khẩu */}
                    <Title level={5}>Đổi mật khẩu</Title>
                    <Form
                        form={pwdForm}
                        layout="vertical"
                        className="w-full"
                        onFinish={handleChangePassword}
                    >
                        <Form.Item
                            label="Mật khẩu hiện tại"
                            name="current_password"
                            rules={[{ required: true }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu mới"
                            name="new_password"
                            rules={[{ required: true, min: 8 }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Nhập lại mật khẩu mới"
                            name="confirm_password"
                            dependencies={["new_password"]}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("new_password") === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(new Error("Không khớp mật khẩu"))
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Button type="default" htmlType="submit">
                            Cập nhật mật khẩu
                        </Button>
                    </Form>
                </div>
            </div>
        </div>
    )
}
