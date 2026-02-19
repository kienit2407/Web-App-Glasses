/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
    Modal,
    Upload,
    message,
    Spin,
    Button,
    Popconfirm,
    Tooltip,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
    InboxOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { API } from "@/app/lib/axios-client";
import { useIsMobile } from "@/hooks/use-is-mobile";

const { Dragger } = Upload;

interface BannerModalProps {
    open: boolean;
    onClose: () => void;
}

interface BannerItem {
    _id: string;
    banner_url: string;
    position: number;
}

const BannerModal = ({ open, onClose }: BannerModalProps) => {
    const isMobile = useIsMobile();

    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // ===== Fetch danh sách banner =====
    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await API.get("/admin/settings/banners");
            const items: BannerItem[] = res.data?.data?.items || [];
            items.sort((a, b) => a.position - b.position);
            setBanners(items);
        } catch (e: any) {
            console.error(e);
            message.error(e?.response?.data?.msg || "Không tải được danh sách banner");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchBanners();
            setFileList([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ===== Upload config =====
    const uploadProps: UploadProps = {
        multiple: true,
        maxCount: 10,
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
        onChange: ({ fileList }) => setFileList(fileList),
        fileList,
    };

    // ===== Thêm banner mới =====
    const handleUpload = async () => {
        if (!fileList.length) {
            message.warning("Vui lòng chọn ít nhất 1 banner");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fileList.forEach((f) => {
                if (f.originFileObj) fd.append("banners", f.originFileObj as File);
            });

            const res = await API.post("/admin/settings/banners", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            message.success("Tải banner lên thành công");
            setFileList([]);

            const items: BannerItem[] = res.data?.data?.items || [];
            items.sort((a, b) => a.position - b.position);
            setBanners(items);
        } catch (e: any) {
            console.error(e);
            message.error(e?.response?.data?.msg || "Có lỗi khi tải banner lên");
        } finally {
            setUploading(false);
        }
    };

    // ===== Xoá 1 banner =====
    const handleDeleteBanner = async (bannerId: string) => {
        try {
            const res = await API.delete(`/admin/settings/banners/${bannerId}`);
            const items: BannerItem[] = res.data?.data?.items || [];
            items.sort((a, b) => a.position - b.position);
            setBanners(items);
            message.success("Đã xoá banner");
        } catch (e: any) {
            console.error(e);
            message.error(e?.response?.data?.msg || "Không xoá được banner");
        }
    };

    // ===== Đổi vị trí local =====
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

    // ===== Lưu thứ tự lên BE =====
    const handleSaveOrder = async () => {
        if (banners.length <= 1) return;
        setSavingOrder(true);
        try {
            const items = banners.map((b, idx) => ({ banner_id: b._id, position: idx }));
            const res = await API.patch("/admin/settings/banners/reorder", { items });

            const list: BannerItem[] = res.data?.data?.items || [];
            list.sort((a, b) => a.position - b.position);
            setBanners(list);

            message.success("Cập nhật thứ tự banner thành công");
        } catch (e: any) {
            console.error(e);
            message.error(e?.response?.data?.msg || "Không lưu được thứ tự banner");
        } finally {
            setSavingOrder(false);
        }
    };

    const handleClose = () => {
        setFileList([]);
        onClose();
    };

    return (
        <Modal
            title="Quản lý banner trang chủ"
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Đóng
                </Button>,
                <Button
                    key="save-order"
                    type="primary"
                    onClick={handleSaveOrder}
                    loading={savingOrder}
                    disabled={banners.length <= 1}
                >
                    Lưu sắp xếp
                </Button>,
            ]}
            width={isMobile ? "95vw" : 820}
            style={isMobile ? { top: 12 } : undefined}
            maskClosable={false}
            bodyStyle={isMobile ? { maxHeight: "75vh", overflowY: "auto" } : undefined}
        >
            <Spin spinning={loading}>
                {/* LIST BANNER HIỆN CÓ + REORDER */}
                <div className="mb-4">
                    <div className="mb-2 font-medium">Banner hiện có</div>

                    {banners.length === 0 ? (
                        <div className="text-xs text-slate-500">
                            Chưa có banner nào. Hãy tải banner lên.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {banners.map((b, index) => (
                                <div
                                    key={b._id}
                                    className="border rounded-md p-2 flex items-center gap-3 min-w-0"
                                >
                                    <div className="w-10 text-center text-xs text-slate-500 shrink-0">
                                        #{index + 1}
                                    </div>

                                    <img
                                        src={b.banner_url}
                                        alt=""
                                        className={`${isMobile ? "w-24 h-14" : "w-32 h-20"} object-cover rounded shrink-0`}
                                    />

                                    <div className="flex-1 text-xs text-slate-500 min-w-0">
                                        position: {b.position}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                        {isMobile ? (
                                            <>
                                                <Tooltip title="Lên">
                                                    <Button
                                                        size="small"
                                                        icon={<ArrowUpOutlined />}
                                                        onClick={() => moveBanner(index, -1)}
                                                        disabled={index === 0}
                                                    />
                                                </Tooltip>

                                                <Tooltip title="Xuống">
                                                    <Button
                                                        size="small"
                                                        icon={<ArrowDownOutlined />}
                                                        onClick={() => moveBanner(index, 1)}
                                                        disabled={index === banners.length - 1}
                                                    />
                                                </Tooltip>

                                                <Popconfirm
                                                    title="Xoá banner"
                                                    okText="Xoá"
                                                    cancelText="Huỷ"
                                                    okButtonProps={{ danger: true }}
                                                    onConfirm={() => handleDeleteBanner(b._id)}
                                                >
                                                    <Tooltip title="Xoá">
                                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                                    </Tooltip>
                                                </Popconfirm>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="small"
                                                    onClick={() => moveBanner(index, -1)}
                                                    disabled={index === 0}
                                                >
                                                    Lên
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => moveBanner(index, 1)}
                                                    disabled={index === banners.length - 1}
                                                >
                                                    Xuống
                                                </Button>
                                                <Popconfirm
                                                    title="Xoá banner"
                                                    okText="Xoá"
                                                    cancelText="Huỷ"
                                                    okButtonProps={{ danger: true }}
                                                    onConfirm={() => handleDeleteBanner(b._id)}
                                                >
                                                    <Button size="small" danger>
                                                        Xoá
                                                    </Button>
                                                </Popconfirm>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* UPLOAD BANNER MỚI */}
                <div className="mt-4">
                    <div className="mb-2 font-medium">Thêm banner mới</div>
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Kéo thả hoặc bấm để chọn ảnh (tối đa 10 file)
                        </p>
                        <p className="ant-upload-hint">JPG/PNG/WebP • Mỗi ảnh &lt; 5MB</p>
                    </Dragger>

                    <div className="mt-3 flex justify-end">
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            loading={uploading}
                            disabled={!fileList.length}
                        >
                            Tải banner lên
                        </Button>
                    </div>
                </div>
            </Spin>
        </Modal>
    );
};

export default BannerModal;
