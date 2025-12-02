/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import { API } from "@/app/lib/axios-client";
import {
    Upload,
    message,
    Card,
    Button,
    Row,
    Col,
    Typography,
    Image,
    Spin,
    Space,
    Divider,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
    InboxOutlined,
    DeleteOutlined,
    ExperimentOutlined,
    UserOutlined,
    ScissorOutlined,
    PlusOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

type TryOnResponse = {
    imageBase64: string;
    mimeType: string;
};

// Component con: Xử lý hiển thị vùng Upload hoặc Preview an toàn
const UploadArea = ({
    title,
    icon,
    desc,
    fileList,
    setFileList, // Truyền hàm set state xuống để xử lý logic tại chỗ
    onRemove,
    ...props
}: any) => {
    // Logic: Chỉ hiện vùng Dragger nếu chưa có file
    const hasFile = fileList.length > 0;
    const file = hasFile ? fileList[0] : null;

    // FIX LỖI TRẮNG MÀN HÌNH:
    // Dùng useMemo để chỉ tạo URL khi file thực sự tồn tại và hợp lệ
    const previewUrl = useMemo(() => {
        if (file && file.originFileObj) {
            try {
                return URL.createObjectURL(file.originFileObj);
            } catch (e) {
                console.error("Lỗi tạo preview ảnh:", e);
                return "";
            }
        }
        return "";
    }, [file]);

    // Cleanup URL để tránh rò rỉ bộ nhớ
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <Card
            title={
                <Space>
                    {icon} <span>{title}</span>
                </Space>
            }
            className="h-full shadow-sm hover:shadow-md transition-shadow"
            bodyStyle={{ height: "100%", minHeight: 220 }}
        >
            {!hasFile ? (
                // TRẠNG THÁI 1: CHƯA CÓ ẢNH -> HIỆN DRAGGER
                <Dragger
                    {...props}
                    fileList={fileList}
                    maxCount={1}
                    showUploadList={false} // Ẩn list mặc định của Antd để tự custom preview
                    accept="image/*"
                    height={180}
                    style={{ border: "2px dashed #d9d9d9", background: "#fafafa" }}
                    beforeUpload={(file) => {
                        // Quan trọng: Set file và return false để chặn auto upload
                        setFileList([
                            {
                                uid: file.uid,
                                name: file.name,
                                status: "done",
                                originFileObj: file, // Lưu file gốc để gửi API
                            },
                        ]);
                        return false;
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: "#1677ff" }} />
                    </p>
                    <p className="ant-upload-text">Kéo thả hoặc chọn ảnh</p>
                    <p className="ant-upload-hint text-xs text-gray-400 px-4">{desc}</p>
                </Dragger>
            ) : (
                // TRẠNG THÁI 2: ĐÃ CÓ ẢNH -> HIỆN PREVIEW VÀ NÚT XOÁ
                <div className="relative group w-full h-[180px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="preview"
                            height="100%"
                            className="object-contain"
                            preview={{ mask: <div className="text-sm">Xem trước</div> }}
                        />
                    ) : (
                        <Spin />
                    )}

                    {/* Overlay nút xóa */}
                    <div className="absolute top-2 right-2 z-10">
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation(); // Chặn sự kiện click lan ra ngoài
                                onRemove();
                            }}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
};

export const VirtualTryOnPage: React.FC = () => {
    const [faceFileList, setFaceFileList] = useState<UploadFile[]>([]);
    const [glassesFileList, setGlassesFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TryOnResponse | null>(null);

    const handleRemoveFace = () => {
        setFaceFileList([]);
        setResult(null); // Xóa kết quả cũ khi đổi ảnh
    };

    const handleRemoveGlasses = () => {
        setGlassesFileList([]);
        setResult(null);
    };

    const handleSubmit = async () => {
        if (!faceFileList[0]?.originFileObj || !glassesFileList[0]?.originFileObj) {
            message.warning("Vui lòng tải lên đủ ảnh khuôn mặt và ảnh kính!");
            return;
        }

        try {
            setLoading(true);
            setResult(null);

            const formData = new FormData();
            formData.append("face", faceFileList[0].originFileObj as File);
            formData.append("glasses", glassesFileList[0].originFileObj as File);

            const res = await API.post<{ data: TryOnResponse }>(
                "/virtual-room/virtual-tryon",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            setResult(res.data.data);
            message.success("Thử kính thành công!");
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    };

    const resultSrc =
        result && `data:${result.mimeType};base64,${result.imageBase64}`;

    return (
        <div className="container mx-auto max-w-8xl px-4 py-10">
            <div className="text-center mb-10">
                <Title level={2} style={{ marginBottom: 0 }} className="flex items-center justify-center gap-2">
                    <ExperimentOutlined className="text-blue-600" /> Phòng Thử Kính Ảo
                </Title>
                <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 16 }}>
                    Công nghệ AI giúp bạn ướm thử kính lên khuôn mặt trước khi mua
                </Paragraph>
            </div>

            <Spin spinning={loading} tip="AI đang xử lý hình ảnh..." size="large">
                <Row gutter={[24, 24]} align="middle" justify="center">
                    {/* Cột 1: Upload Mặt */}
                    <Col xs={24} md={10}>
                        <UploadArea
                            title="Ảnh khuôn mặt"
                            icon={<UserOutlined />}
                            desc="Ảnh chính diện, đủ sáng, không bị che khuất."
                            fileList={faceFileList}
                            setFileList={setFaceFileList}
                            onRemove={handleRemoveFace}
                        />
                    </Col>

                    {/* Icon cộng ở giữa */}
                    <Col xs={0} md={4} className="flex justify-center">
                        <div className="bg-gray-100 p-4 rounded-full">
                            <PlusOutlined style={{ fontSize: 24, color: "#999" }} />
                        </div>
                    </Col>

                    {/* Cột 2: Upload Kính */}
                    <Col xs={24} md={10}>
                        <UploadArea
                            title="Ảnh mẫu kính"
                            icon={<ScissorOutlined rotate={270} />}
                            desc="Ảnh kính tách nền hoặc trên nền trắng rõ nét."
                            fileList={glassesFileList}
                            setFileList={setGlassesFileList}
                            onRemove={handleRemoveGlasses}
                        />
                    </Col>
                </Row>

                {/* Nút hành động */}
                <div className="mt-10 flex flex-col items-center">
                    <Button
                        type="primary"
                        size="large"
                        icon={<ExperimentOutlined />}
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            height: 50,
                            paddingLeft: 40,
                            paddingRight: 40,
                            fontSize: 18,
                            borderRadius: 25,
                            boxShadow: "0 4px 14px 0 rgba(22, 119, 255, 0.39)"
                        }}
                    >
                        Thử Kính Ngay
                    </Button>
                    <Text type="secondary" className="mt-3 text-xs">
                        Hệ thống sử dụng Gemini AI. Thời gian xử lý khoảng 5-10 giây.
                    </Text>
                </div>
            </Spin>

            {/* Kết quả */}
            {resultSrc && (
                <div className="animate-fade-in-up">
                    <Divider style={{ margin: "40px 0" }} />
                    <div className="text-center">
                        <Title level={3}>✨ Kết quả thử kính</Title>
                        <div className="mt-6 inline-block p-2 bg-white rounded-xl shadow-lg border border-gray-100">
                            <Image
                                width={400}
                                src={resultSrc}
                                alt="Result"
                                style={{ borderRadius: 8, maxHeight: 500, objectFit: "contain" }}
                            />
                        </div>
                        <div className="mt-4">
                            <Button href={resultSrc} download="try-on-result.png" type="link">
                                Tải ảnh về
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};