/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Checkbox } from "antd";
import { API } from "@/app/lib/axios-client";
import { toast } from "sonner";

interface SimpleGeo {
    code: string;
    name: string;
}

interface CreateAddressModalProps {
    open: boolean;
    onClose: () => void;
    // nhận về id địa chỉ mới tạo (nếu BE trả về)
    onSuccess?: (newAddressId?: string) => void;
}

export const CreateAddressModal = ({
    open,
    onClose,
    onSuccess,
}: CreateAddressModalProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [provinces, setProvinces] = useState<SimpleGeo[]>([]);
    const [districts, setDistricts] = useState<SimpleGeo[]>([]);
    const [wards, setWards] = useState<SimpleGeo[]>([]);

    const provinceCode = Form.useWatch("province_code", form);
    const districtCode = Form.useWatch("district_code", form);

    const fetchProvinces = async () => {
        const res = await API.get("/geo/provinces");
        setProvinces(res.data?.data || []);
    };

    const fetchDistricts = async (province_code: string) => {
        const res = await API.get("/geo/districts", { params: { province_code } });
        setDistricts(res.data?.data || []);
    };

    const fetchWards = async (district_code: string) => {
        const res = await API.get("/geo/wards", { params: { district_code } });
        setWards(res.data?.data || []);
    };

    useEffect(() => {
        if (open) {
            form.resetFields();
            setDistricts([]);
            setWards([]);
            fetchProvinces().catch((err) => {
                console.error(err);
                toast.error("Không tải được danh sách tỉnh/thành");
            });
        }
    }, [open]);

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const res = await API.post("/users/me/address", values);
            toast.success("Thêm địa chỉ mới thành công");

            const newAddrId: string | undefined = res.data?.data?._id;
            onClose();
            onSuccess?.(newAddrId);
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.msg || "Không thể lưu địa chỉ, vui lòng thử lại"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Thêm địa chỉ mới"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText="Lưu"
            confirmLoading={loading}
            width={720}
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
                                });
                                setDistricts([]);
                                setWards([]);
                                fetchDistricts(value).catch(console.error);
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
                                form.setFieldsValue({ ward_code: undefined });
                                setWards([]);
                                fetchWards(value).catch(console.error);
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
    );
};
