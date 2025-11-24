import { useEffect, useState } from "react";
import { Modal, Button, Typography } from "antd";
import { API } from "@/app/lib/axios-client";

const { Text } = Typography;

type HighlightPromotion = {
    _id: string;
    title: string;
    description?: string;
    banner_url?: string | null;
    start_date: string;
    end_date?: string | null;
};

type Props = {
    open: boolean;
    onClose: () => void;
};

export const PromotionHighlightModal = ({ open, onClose }: Props) => {
    const [loading, setLoading] = useState(false);
    const [promotion, setPromotion] = useState<HighlightPromotion | null>(null);

    const fetchHighlight = async () => {
        setLoading(true);
        try {
            const res = await API.get("/promotions/highlight");
            const data = res.data?.data as {
                promotion: HighlightPromotion | null;
                already_seen: boolean;
            };

            if (!data.promotion || data.already_seen) {
                setPromotion(null);
            } else {
                setPromotion(data.promotion);
            }
        } catch (err) {
            console.error(err);
            setPromotion(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchHighlight();
        }
    }, [open]);

    const handleClose = async () => {
        if (promotion?._id) {
            try {
                await API.post(`/promotions/${promotion._id}/seen`);
            } catch (e) {
                console.error(e);
            }
        }
        onClose();
    };

    if (!promotion) return null;

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={380} // nhỏ lại
            title={null} // bỏ title để không có header trắng
            maskClosable
            closable={false} // tự làm nút close trên ảnh nếu thích
            styles={{
                content: {
                    background: "transparent",
                    boxShadow: "none",
                    padding: 0,
                },
                body: {
                    padding: 0,
                    background: "transparent",
                },
                header: {
                    display: "none",
                },
            }}
            maskStyle={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
            {loading ? (
                <div className="flex justify-center py-6">
                    <Text>Đang tải...</Text>
                </div>
            ) : (
                <div className="relative">
                    {promotion.banner_url && (
                        <img
                            src={promotion.banner_url}
                            alt={promotion.title}
                            className="w-full rounded-lg object-cover"
                        />
                    )}

                    {promotion.description && (
                        <div className="mt-3 px-2">
                            <p className="text-xs text-center text-gray-100 drop-shadow">
                                {promotion.description}
                            </p>
                        </div>
                    )}

                    {/* nút đóng kiểu nổi trên ảnh */}
                    <button
                        onClick={handleClose}
                        className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                    >
                        ✕
                    </button>
                </div>
            )}
        </Modal>
    );
};
