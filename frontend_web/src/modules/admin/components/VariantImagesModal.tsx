/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Modal,
    Upload,
    message,
    Spin,
    Button,
    Popconfirm,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";

const { Dragger } = Upload;

interface VariantImagesModalProps {
    open: boolean;
    productId: string | null;
    variantId: string | null;
    onClose: () => void;
}

interface VariantImage {
    _id: string;
    url: string;
    position: number;
}

const VariantImagesModal = ({
    open,
    productId,
    variantId,
    onClose,
}: VariantImagesModalProps) => {
    const [images, setImages] = useState<VariantImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const fetchImages = async () => {
        if (!variantId) return;
        setLoading(true);
        try {
            const res = await API.get(`/admin/products/variants/${variantId}/images`);
            const items = res.data?.data?.items || [];
            // sort theo position cho chắc
            items.sort((a: VariantImage, b: VariantImage) => a.position - b.position);
            setImages(items);
        } catch (e: any) {
            console.error(e);
            message.error(
                e?.response?.data?.msg || "Không tải được danh sách ảnh biến thể"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && variantId) {
            fetchImages();
            setFileList([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, variantId]);

    const uploadProps: UploadProps = {
        multiple: true,
        maxCount: 5,
        listType: "picture",
        beforeUpload: (file) => {
            const okType = ["image/jpeg", "image/png", "image/webp"].includes(
                file.type
            );
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

    // Thêm ảnh mới
    const handleUpload = async () => {
        if (!productId || !variantId) return;
        if (!fileList.length) {
            message.warning("Vui lòng chọn ít nhất 1 ảnh");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fileList.forEach((f) => {
                if (f.originFileObj) {
                    fd.append("images", f.originFileObj as File);
                }
            });

            await API.post(
                `/admin/products/${productId}/variants/${variantId}/images`,
                fd
            );

            message.success("Tải ảnh lên thành công");
            setFileList([]);
            // refetch để có đủ id + position mới
            fetchImages();
        } catch (e: any) {
            console.error(e);
            message.error(
                e?.response?.data?.msg || "Có lỗi khi tải ảnh biến thể lên"
            );
        } finally {
            setUploading(false);
        }
    };

    // Xoá 1 ảnh (soft + hard ở BE là xoá hẳn record + Cloudinary)
    const handleDeleteImage = async (imageId: string) => {
        try {
            await API.delete(`/admin/products/images/${imageId}`);
            message.success("Xoá ảnh thành công");
            // cập nhật state local luôn cho nhanh
            setImages((prev) => prev.filter((img) => img._id !== imageId));
        } catch (e: any) {
            console.error(e);
            message.error(e?.response?.data?.msg || "Không xoá được ảnh");
        }
    };

    // Helper đổi vị trí local: move item index -> index + delta
    const moveImage = (index: number, delta: number) => {
        setImages((prev) => {
            const newArr = [...prev];
            const newIndex = index + delta;
            if (newIndex < 0 || newIndex >= newArr.length) return prev;
            const [removed] = newArr.splice(index, 1);
            newArr.splice(newIndex, 0, removed);
            return newArr;
        });
    };

    // Lưu thứ tự (gửi positions mới lên BE)
    const handleSaveOrder = async () => {
        if (!variantId) return;
        setSavingOrder(true);
        try {
            const items = images.map((img, idx) => ({
                image_id: img._id,
                position: idx, // normalize 0..n-1
            }));

            await API.patch(
                `/admin/products/variants/${variantId}/images/reorder`,
                { items }
            );

            message.success("Cập nhật thành công");
            // đồng bộ lại positions trong state
            setImages((prev) =>
                prev.map((img, idx) => ({ ...img, position: idx }))
            );
        } catch (e: any) {
            console.error(e);
            message.error(
                e?.response?.data?.msg || "Không lưu được thứ tự ảnh"
            );
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
            title="Ảnh biến thể"
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
                    disabled={images.length <= 1}
                >
                    Lưu sắp xếp
                </Button>,
            ]}
            width={820}
            maskClosable={false}
        >
            <Spin spinning={loading}>
                {/* LIST ẢNH HIỆN CÓ + REORDER */}
                <div className="mb-4">
                    <div className="mb-2 font-medium">Ảnh hiện có</div>
                    {images.length === 0 ? (
                        <div className="text-xs text-slate-500">
                            Chưa có ảnh nào cho biến thể này.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {images.map((img, index) => (
                                <div
                                    key={img._id}
                                    className="border rounded-md p-2 flex items-center gap-3"
                                >
                                    <div className="w-16 text-center text-xs text-slate-500">
                                        #{index + 1}
                                    </div>
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="w-20 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1 text-xs text-slate-500">
                                        position: {img.position}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="small"
                                            onClick={() => moveImage(index, -1)}
                                            disabled={index === 0}
                                        >
                                            Lên
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => moveImage(index, 1)}
                                            disabled={index === images.length - 1}
                                        >
                                            Xuống
                                        </Button>
                                        <Popconfirm
                                            title="Xoá ảnh"
                                            description="Bạn có chắc muốn xoá ảnh này?"
                                            okText="Xoá"
                                            cancelText="Huỷ"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => handleDeleteImage(img._id)}
                                        >
                                            <Button size="small" danger>
                                                Xoá
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* UPLOAD ẢNH MỚI */}
                <div className="mt-4">
                    <div className="mb-2 font-medium">Thêm ảnh mới</div>
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Kéo thả hoặc bấm để chọn ảnh (tối đa 5/file)
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
                            Tải ảnh lên
                        </Button>
                    </div>
                </div>
            </Spin>
        </Modal>
    );
};

export default VariantImagesModal;
