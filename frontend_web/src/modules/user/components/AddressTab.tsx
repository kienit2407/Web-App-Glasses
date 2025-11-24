/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/user/account/AddressTab.tsx
import { useEffect, useState } from "react"
import {
    Button,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Space,
    Typography,
    Popconfirm,
    Checkbox,
} from "antd"
import { API } from "@/app/lib/axios-client"
import { PlusOutlined } from "@ant-design/icons"
import { toast } from "sonner"

const { Title, Text } = Typography

interface Address {
    _id: string
    recipient_name: string
    phone: string
    province_code: string
    district_code: string
    ward_code: string
    specific_address: string
    is_default: boolean
}

interface SimpleGeo {
    code: string
    name: string
}

export const AddressTab = () => {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [defaultId, setDefaultId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const [provinces, setProvinces] = useState<SimpleGeo[]>([])
    const [districts, setDistricts] = useState<SimpleGeo[]>([])
    const [wards, setWards] = useState<SimpleGeo[]>([])

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Address | null>(null)
    const [form] = Form.useForm()
    
    const fetchAddresses = async () => {
        setLoading(true)
        try {
            const res = await API.get("/users/me/address")
            const data = res.data?.data
            setAddresses(data.addresses || [])
            setDefaultId(data.default_address_id || null)
        } catch (err: any) {
            console.error(err)
            toast.error("Không thể tải danh sách địa chỉ")
        } finally {
            setLoading(false)
        }
    }

    const fetchProvinces = async () => {
        const res = await API.get("/geo/provinces")
        setProvinces(res.data?.data || [])
    }

    const fetchDistricts = async (province_code: string) => {
        const res = await API.get("/geo/districts", { params: { province_code } })
        setDistricts(res.data?.data || [])
    }

    const fetchWards = async (district_code: string) => {
        const res = await API.get("/geo/wards", { params: { district_code } })
        setWards(res.data?.data || [])
    }

    useEffect(() => {
        fetchAddresses()
        fetchProvinces()
    }, [])

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setDistricts([])
        setWards([])
        setModalOpen(true)
    }

    const openEdit = (addr: Address) => {
        setEditing(addr)
        form.setFieldsValue({
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            province_code: addr.province_code,
            district_code: addr.district_code,
            ward_code: addr.ward_code,
            specific_address: addr.specific_address,
            is_default: addr.is_default,
        })
        fetchDistricts(addr.province_code)
        fetchWards(addr.district_code)
        setModalOpen(true)
    }

    const handleSubmit = async (values: any) => {
        try {
            if (editing) {
                await API.patch(`/users/me/address/${editing._id}`, values)
                toast.success("Cập nhật địa chỉ thành công")
            } else {
                await API.post("/users/me/address", values)
                toast.success("Thêm địa chỉ mới thành công")
            }
            setModalOpen(false)
            await fetchAddresses()
        } catch (err: any) {
            console.error(err)
            toast.error(err?.response?.data?.msg || "Không thể lưu địa chỉ")
        }
    }
    const provinceCode = Form.useWatch("province_code", form)
    const districtCode = Form.useWatch("district_code", form)
    const handleDelete = async (id: string) => {
        try {
            await API.delete(`/users/me/address/${id}`)
            toast.success("Xoá địa chỉ thành công")
            await fetchAddresses()
        } catch (err: any) {
            console.error(err)
            toast.error(err?.response?.data?.msg || "Không thể xoá địa chỉ")
        }
    }

    const handleSetDefault = async (id: string) => {
        try {
            await API.patch(`/users/me/address/${id}/default`)
            toast.success("Đã đặt làm địa chỉ mặc định")
            await fetchAddresses()
        } catch (err: any) {
            console.error(err)
            toast.error("Không thể đặt mặc định")
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Title level={4}>Địa chỉ của tôi</Title>
                    <Text type="secondary">
                        Quản lý địa chỉ nhận hàng để tính phí vận chuyển thuận tiện
                    </Text>
                </div>

                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    Thêm địa chỉ mới
                </Button>
            </div>

            <div className="space-y-4">
                {addresses.map((addr) => (
                    <div
                        key={addr._id}
                        className="border border-border rounded-lg px-5 py-4 flex justify-between items-start"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold">{addr.recipient_name}</span>
                                <span className="text-sm text-muted-foreground">
                                    {addr.phone}
                                </span>
                                {addr.is_default && <Tag color="red">Mặc định</Tag>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {addr.specific_address}
                                {/* nếu muốn bạn call API thêm để hiển thị tên tỉnh/huyện/xã */}
                            </div>
                        </div>

                        <Space>
                            {!addr.is_default && (
                                <Button
                                    variant="filled"
                                    color="orange"
                                    size="small"
                                    type="default"
                                    onClick={() => handleSetDefault(addr._id)}
                                >
                                    Thiết lập mặc định
                                </Button>
                            )}
                            <Button
                                variant="filled"
                                color="blue"
                                size="small" type="link" onClick={() => openEdit(addr)}>
                                Cập nhật
                            </Button>
                            <Popconfirm
                                title="Xoá địa chỉ này?"
                                onConfirm={() => handleDelete(addr._id)}
                            >
                                <Button
                                    variant="filled"
                                    color="danger"
                                    size="small" type="link" danger>
                                    Xoá
                                </Button>
                            </Popconfirm>
                        </Space>
                    </div>
                ))}

                {!addresses.length && (
                    <div className="text-center text-muted-foreground py-10">
                        Bạn chưa có địa chỉ nào, hãy thêm địa chỉ mới.
                    </div>
                )}
            </div>

            {/* MODAL ADD / EDIT */}
            <Modal
                title={editing ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                okText="Lưu"
                width={720}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        label="Tên người nhận"
                        name="recipient_name"
                        rules={[{ required: true, message: "Nhập tên người nhận" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ required: true, message: "Nhập số điện thoại" }]}
                    >
                        <Input />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Form.Item
                            label="Tỉnh / Thành"
                            name="province_code"
                            rules={[{ required: true }]}
                        >
                            <Select
                                placeholder="Chọn tỉnh/thành"
                                options={provinces.map((p) => ({
                                    value: p.code,
                                    label: p.name,
                                }))}
                                onChange={(value) => {
                                    form.setFieldsValue({
                                        district_code: undefined,
                                        ward_code: undefined,
                                    })
                                    setDistricts([])
                                    setWards([])
                                    fetchDistricts(value)
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Quận / Huyện"
                            name="district_code"
                            rules={[{ required: true }]}
                        >
                            <Select
                                disabled={!provinceCode}
                                placeholder="Chọn quận/huyện"
                                options={districts.map((d) => ({
                                    value: d.code,
                                    label: d.name,
                                }))}
                                onChange={(value) => {
                                    form.setFieldsValue({ ward_code: undefined })
                                    setWards([])
                                    fetchWards(value)
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Phường / Xã"
                            name="ward_code"
                            rules={[{ required: true }]}
                        >
                            <Select
                                disabled={!districtCode}
                                placeholder="Chọn phường/xã"
                                options={wards.map((w) => ({
                                    value: w.code,
                                    label: w.name,
                                }))}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Địa chỉ cụ thể"
                        name="specific_address"
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item name="is_default" valuePropName="checked">
                        <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
