// src/modules/admin/pages/Settings.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Card,
  Row,
  Col,
} from "antd";
import type { UploadFile, UploadProps, GetProp } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { API } from "@/app/lib/axios-client";
import { useShopSettingsStore } from "@/hooks/use-setting";
import BannerModal from "../components/BannerModal";


type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];
interface BannerItem {
  _id: string;
  banner_url: string;
  position: number;
}
interface Province {
  code: string;
  name: string;
}
interface District {
  code: string;
  name: string;
}
interface Ward {
  code: string;
  name: string;
}

interface SettingsFormValues {
  shop_name: string;
  shop_email: string;
  shop_phone: string
  logo?: UploadFile[];
  province_code?: string;
  district_code?: string;
  ward_code?: string;
  address_line?: string;
}

const normFile = (e: any) => {
  if (Array.isArray(e)) return e;
  return e?.fileList;
};

const AdminSettings = () => {
  const [form] = Form.useForm<SettingsFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerSavingOrder, setBannerSavingOrder] = useState(false);
  const [bannerFileList, setBannerFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const { setSettings } = useShopSettingsStore(); // để share global

  // Upload config
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

    return false; // không auto upload
  };

  const uploadButton = (
    <button type="button" style={{ border: 0, background: "none" }}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải logo</div>
    </button>
  );

  // Fetch geo
  const fetchProvinces = async () => {
    const res = await API.get("/geo/provinces");
    setProvinces(res.data?.data || []);
  };

  const fetchDistricts = async (province_code: string) => {
    if (!province_code) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const res = await API.get("/geo/districts", { params: { province_code } });
    setDistricts(res.data?.data || []);
  };
  const bannerUploadProps: UploadProps = {
    multiple: true,
    listType: "picture",
    fileList: bannerFileList,
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
      return false;
    },
    onChange: ({ fileList }) => setBannerFileList(fileList),
  };
  const fetchWards = async (district_code: string) => {
    if (!district_code) {
      setWards([]);
      return;
    }
    const res = await API.get("/geo/wards", { params: { district_code } });
    setWards(res.data?.data || []);
  };
  const handleUploadBanners = async () => {
    if (!bannerFileList.length) {
      message.warning("Vui lòng chọn ít nhất 1 banner");
      return;
    }
    setBannerUploading(true);
    try {
      const fd = new FormData();
      bannerFileList.forEach((f) => {
        if (f.originFileObj) {
          fd.append("banners", f.originFileObj as File);
        }
      });

      const res = await API.post("/admin/settings/banners", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const items: BannerItem[] = res.data?.data?.items || [];
      setBanners(items.sort((a, b) => a.position - b.position));
      setBannerFileList([]);
      message.success("Tải banner thành công");
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.msg || "Không tải được banner");
    } finally {
      setBannerUploading(false);
    }
  };
  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await API.delete(`/admin/settings/banners/${id}`);
      const items: BannerItem[] = res.data?.data?.items || [];
      setBanners(items.sort((a, b) => a.position - b.position));
      message.success("Đã xoá banner");
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.msg || "Không xoá được banner");
    }
  };
  const handleSaveBannerOrder = async () => {
    if (banners.length <= 1) return;
    setBannerSavingOrder(true);
    try {
      const items = banners.map((b, idx) => ({
        banner_id: b._id,
        position: idx,
      }));
      const res = await API.patch("/admin/settings/banners/reorder", { items });
      const list: BannerItem[] = res.data?.data?.items || [];
      setBanners(list.sort((a, b) => a.position - b.position));
      message.success("Cập nhật thứ tự banner thành công");
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.msg || "Không lưu được thứ tự banner");
    } finally {
      setBannerSavingOrder(false);
    }
  };
  const moveBanner = (index: number, delta: number) => {
    setBanners((prev) => {
      const arr = [...prev];
      const newIndex = index + delta;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      const [removed] = arr.splice(index, 1);
      arr.splice(newIndex, 0, removed);
      return arr;
    });
  };
  // Fetch settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/settings");
      const s = res.data?.data;
      const list: BannerItem[] = (s?.banner_list || []).sort(
        (a: any, b: any) => a.position - b.position
      );
      setBanners(list);
      // lưu vào global store cho FE user dùng
      setSettings(s);
      let logoFileList: UploadFile[] | undefined = undefined;
      if (s?.shop_logo_url) {
        logoFileList = [
          {
            uid: "-1",
            name: "logo",
            status: "done",
            url: s.shop_logo_url,
          } as UploadFile,
        ];
      }
      // fill form
      form.setFieldsValue({
        shop_name: s?.shop_name || "",
        shop_email: s?.shop_email || "",
        province_code: s?.shipping_origin?.province_code,
        district_code: s?.shipping_origin?.district_code,
        ward_code: s?.shipping_origin?.ward_code,
        address_line: s?.shipping_origin?.address_line,
        shop_phone: s?.shop_phone || "",
        logo: logoFileList
      });

      // load districts/wards tương ứng
      if (s?.shipping_origin?.province_code) {
        await fetchDistricts(s.shipping_origin.province_code);
      }
      if (s?.shipping_origin?.district_code) {
        await fetchWards(s.shipping_origin.district_code);
      }
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.msg || "Không tải được cài đặt cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinces();
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 1) Gửi GENERAL (name, email, logo)
      const fd = new FormData();
      fd.append("shop_name", values.shop_name || "");
      fd.append("shop_email", values.shop_email || "");
      fd.append("shop_phone", values.shop_phone || "");

      const logoList = values.logo as UploadFile[] | undefined;
      if (logoList && logoList.length > 0 && logoList[0].originFileObj) {
        fd.append("logo", logoList[0].originFileObj as File);
      }

      // 2) Gửi SHIPPING ORIGIN
      const shippingBody = {
        province_code: values.province_code,
        district_code: values.district_code,
        ward_code: values.ward_code,
        address_line: values.address_line,
      };

      await Promise.all([
        API.put("/admin/settings/general", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        API.put("/admin/settings/shipping-origin", shippingBody),
      ]);

      message.success("Cập nhật cài đặt cửa hàng thành công");
      // refetch để đồng bộ lại (logo mới, name, v.v.)
      fetchSettings();
    } catch (err: any) {
      if (err?.errorFields) {
        message.error("Vui lòng kiểm tra lại các trường bắt buộc");
      } else {
        console.error(err);
        message.error(
          err?.response?.data?.msg || "Không thể cập nhật cài đặt cửa hàng"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // handle change province/district
  const handleProvinceChange = (value: string) => {
    form.setFieldsValue({
      province_code: value,
      district_code: undefined,
      ward_code: undefined,
    });
    fetchDistricts(value);
    setWards([]);
  };

  const handleDistrictChange = (value: string) => {
    form.setFieldsValue({
      district_code: value,
      ward_code: undefined,
    });
    fetchWards(value);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Cài đặt hệ thống</h2>

      <Card loading={loading} className="mb-4">
        <Form<SettingsFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên cửa hàng"
                name="shop_name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên cửa hàng" },
                ]}
              >
                <Input placeholder="Ví dụ: Kinit Eyewear" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email liên hệ"
                name="shop_email"
                rules={[
                  {
                    type: "email",
                    message: "Email không hợp lệ",
                  },
                  {
                    required: true,
                    message: "Vui lòng nhập email liên hệ",
                  },
                ]}
              >
                <Input placeholder="Ví dụ: support@yourshop.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Logo cửa hàng"
            name="logo"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                validator: (_, value: UploadFile[]) => {
                  const files = value || [];
                  if (files.length === 0) {
                    return Promise.reject(
                      new Error("Shop phải có đúng 1 logo")
                    );
                  }
                  if (files.length > 1) {
                    return Promise.reject(
                      new Error("Chỉ được chọn 1 logo")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              listType="picture-card"
              beforeUpload={beforeUpload}
              maxCount={1}

            >
              {uploadButton}
            </Upload>
          </Form.Item>
          <Row>
            <Button
              variant="filled"
              color="orange"
              onClick={() => setBannerModalOpen(true)}>
              Quản lý banner
            </Button>
          </Row>
          <h3 className="text-lg font-semibold mt-4 mb-2">
            Địa chỉ kho gửi hàng
          </h3>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tỉnh / Thành phố"
                name="province_code"
                rules={[
                  { required: true, message: "Vui lòng chọn tỉnh / thành" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành"
                  optionFilterProp="children"
                  onChange={handleProvinceChange}
                  options={provinces.map((p) => ({
                    label: p.name,
                    value: p.code,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Quận / Huyện"
                name="district_code"
                rules={[
                  { required: true, message: "Vui lòng chọn quận / huyện" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn quận/huyện"
                  optionFilterProp="children"
                  onChange={handleDistrictChange}
                  disabled={!form.getFieldValue("province_code")}
                  options={districts.map((d) => ({
                    label: d.name,
                    value: d.code,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phường / Xã"
                name="ward_code"
                rules={[
                  { required: true, message: "Vui lòng chọn phường / xã" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn phường/xã"
                  optionFilterProp="children"
                  disabled={!form.getFieldValue("district_code")}
                  options={wards.map((w) => ({
                    label: w.name,
                    value: w.code,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Địa chỉ chi tiết"
                name="address_line"
                rules={[
                  { required: true, message: "Vui lòng nhập địa chỉ chi tiết" },
                ]}
              >
                <Input placeholder="Ví dụ: Số 1 Trần Duy Hưng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="shop_phone"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoai liên hệ",
                  },
                ]}
              >
                <Input placeholder="Ví dụ: 0123456789" />
              </Form.Item>
            </Col>
          </Row>
          <BannerModal
            open={bannerModalOpen}
            onClose={() => setBannerModalOpen(false)}
          />
          <div className="flex justify-center mt-4">
            <Button type="primary" htmlType="submit" loading={submitting}>
              Lưu cài đặt
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSettings;
