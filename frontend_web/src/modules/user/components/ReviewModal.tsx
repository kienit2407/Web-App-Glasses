// src/modules/user/components/ReviewModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import { Textarea } from "@/components/ui/textarea";
import { Star, Image as ImageIcon, Video as VideoIcon } from "lucide-react";

interface ImageMeta {
    url: string;
    url_id?: string;
}

interface Props {
    open: boolean;
    mode: "create" | "edit";
    defaultRating?: number;
    defaultComment?: string;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    productId: string;

    // media đang lưu trong DB (dùng cho edit)
    existingImages?: ImageMeta[];
    existingVideoUrl?: string | null;
}

const MAX_IMAGES = 5;

export const ReviewModal = ({
    open,
    mode,
    defaultRating = 5,
    defaultComment = "",
    onClose,
    onSubmit,
    productId,
    existingImages = [],
    existingVideoUrl = null,
}: Props) => {
    const [rating, setRating] = useState(defaultRating);
    const [comment, setComment] = useState(defaultComment);

    // ===== ẢNH / VIDEO CŨ TỪ DB =====
    const [serverImages, setServerImages] = useState<ImageMeta[]>(existingImages);
    const [serverVideoUrl, setServerVideoUrl] = useState<string | null>(
        existingVideoUrl
    );

    // ===== ẢNH / VIDEO MỚI CHỌN TRONG LẦN MỞ NÀY =====
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newVideo, setNewVideo] = useState<File | null>(null);

    // ===== THÔNG TIN XOÁ MEDIA CŨ =====
    const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
    const [removeServerVideo, setRemoveServerVideo] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);

    // Khi mở modal lại → sync với props + reset state tạm
    useEffect(() => {
        if (open) {
            setRating(defaultRating);
            setComment(defaultComment);

            setServerImages(existingImages || []);
            setServerVideoUrl(existingVideoUrl || null);

            setNewImages([]);
            setNewVideo(null);
            setRemovedImageIds([]);
            setRemoveServerVideo(false);
        }
    }, [open]);

    // ========= HANDLERS =========
    const handleSubmit = async () => {
        if (!productId || submitting) return;

        const fd = new FormData();
        fd.append("product_id", productId);
        fd.append("rating", String(rating));
        fd.append("comment", comment);

        // 1. Gửi ảnh mới
        newImages.forEach((f) => fd.append("images", f));

        // 2. Gửi video mới nếu có
        if (newVideo) {
            fd.append("video", newVideo);
        }

        // 3. Gửi danh sách url_id ảnh cũ bị xoá → backend xoá Cloudinary
        fd.append("removed_image_ids", JSON.stringify(removedImageIds));

        // 4. Flag xoá video cũ
        fd.append("remove_old_video", removeServerVideo ? "1" : "0");

        try {
            setSubmitting(true);
            await onSubmit(fd);
        } finally {
            setSubmitting(false);
        }
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        setNewImages((prev) => {
            const already = serverImages.length + prev.length; // ảnh cũ + mới đã có
            const remain = MAX_IMAGES - already;

            if (remain <= 0) {
                // có thể toast ở đây nếu muốn
                // message.warning("Bạn chỉ được upload tối đa 5 ảnh");
                return prev;
            }

            const picked = files.slice(0, remain); // chỉ lấy đủ số slot còn lại
            return [...prev, ...picked];
        });

        e.target.value = "";
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setNewVideo(e.target.files[0]);
        e.target.value = "";
    };

    // Xoá ảnh mới (chưa upload)
    const handleRemoveNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Xoá video mới (chưa upload)
    const handleRemoveNewVideo = () => {
        setNewVideo(null);
    };

    // Xoá ảnh cũ đã lưu trên server
    const handleRemoveServerImage = (url_id?: string) => {
        if (!url_id) return;
        setServerImages((prev) => prev.filter((img) => img.url_id !== url_id));
        setRemovedImageIds((prev) => [...prev, url_id]);
    };

    // Xoá video cũ
    const handleRemoveServerVideo = () => {
        if (!serverVideoUrl) return;
        setServerVideoUrl(null);
        setRemoveServerVideo(true);
    };

    const handleCancel = () => {
        if (submitting) return;
        onClose();
    };

    const totalImagesCount = serverImages.length + newImages.length;

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText={mode === "create" ? "Gửi đánh giá" : "Lưu thay đổi"}
            cancelText="Huỷ"
            confirmLoading={submitting}
            title={mode === "create" ? "Viết đánh giá" : "Chỉnh sửa đánh giá"}
            maskClosable={!submitting}
            destroyOnClose={false}
        >
            {/* Rating */}
            <div className="flex items-center gap-2 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus-visible:outline-none"
                    >
                        <Star
                            className={`h-6 w-6 transition ${star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                        />
                    </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                    {rating} / 5
                </span>
            </div>

            {/* Comment + action bar */}
            <div className="border rounded-xl bg-muted/40 px-3 pt-2 pb-3">
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    rows={4}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />

                <div className="mt-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImagesChange}
                        />
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoChange}
                        />

                        <button
                            type="button"
                            disabled={totalImagesCount >= MAX_IMAGES}
                            onClick={() =>
                                totalImagesCount < MAX_IMAGES &&
                                imageInputRef.current?.click()
                            }
                            className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-muted transition text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Ảnh</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-muted transition text-muted-foreground"
                        >
                            <VideoIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Video</span>
                        </button>
                    </div>

                    <span className="text-xs text-muted-foreground">
                        {totalImagesCount > 0 && `${totalImagesCount}/${MAX_IMAGES} ảnh`}
                    </span>
                </div>
            </div>

            {/* ẢNH CŨ */}
            {serverImages.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Ảnh hiện tại</p>
                    <div className="flex flex-wrap gap-2">
                        {serverImages.map((img) => (
                            <div
                                key={img.url_id ?? img.url}
                                className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted"
                            >
                                <img
                                    src={img.url}
                                    alt="review-img"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveServerImage(img.url_id)}
                                    className="absolute right-0 top-0 text-[10px] px-1 bg-black/60 text-white"
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ẢNH MỚI */}
            {newImages.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Ảnh mới</p>
                    <div className="flex flex-wrap gap-2">
                        {newImages.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                                <div
                                    key={idx}
                                    className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted"
                                >
                                    <img
                                        src={url}
                                        alt={`preview-${idx}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNewImage(idx)}
                                        className="absolute right-0 top-0 text-[10px] px-1 bg-black/60 text-white"
                                    >
                                        x
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIDEO CŨ */}
            {serverVideoUrl && (
                <div className="mt-3 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
                    <span className="truncate max-w-[220px]">Video hiện tại</span>
                    <button
                        type="button"
                        onClick={handleRemoveServerVideo}
                        className="text-red-500 hover:underline"
                    >
                        Xoá video hiện tại
                    </button>
                </div>
            )}

            {/* VIDEO MỚI */}
            {newVideo && (
                <div className="mt-2 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
                    <span className="truncate max-w-[220px]">
                        Video mới: <span className="font-medium">{newVideo.name}</span>
                    </span>
                    <button
                        type="button"
                        onClick={handleRemoveNewVideo}
                        className="text-red-500 hover:underline"
                    >
                        Xoá video mới
                    </button>
                </div>
            )}
        </Modal>
    );
};
