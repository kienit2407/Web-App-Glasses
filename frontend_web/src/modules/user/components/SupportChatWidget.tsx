/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import {
    Card,
    Input,
    Button,
    Spin,
    Empty,
    Upload,
    Tooltip,
    Badge,
} from "antd";
import {
    MessageOutlined,
    SendOutlined,
    PaperClipOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SupportConversation, SupportMessage } from "@/types/support";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
    fetchMySupportConversations,
    fetchMySupportMessages,
    sendUserSupportMedia,
    sendUserSupportMessage,
} from "@/utils/support.api";
import { RcFile } from "antd/es/upload";
import { useSocket } from "@/hooks/use-socket";
import { TypingDots } from "./ChatTypingIndicator";


const { TextArea } = Input;

export const SupportChatWidget = () => {
    const socket = useSocket()
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [activeConv, setActiveConv] = useState<SupportConversation | null>(null);
    const [input, setInput] = useState("");
    const [unreadBadge, setUnreadBadge] = useState(0);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    // ref để auto scroll giống Messenger
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // socket – nhận event chat:new_message từ server, invalidate query + play sound


    // ===== LẤY DANH SÁCH HỘI THOẠI CỦA USER =====
    const {
        data: convs,
        isLoading: convLoading,
    } = useQuery<SupportConversation[]>({
        queryKey: ["user-support-conversations"],
        queryFn: fetchMySupportConversations,
    });

    // Chọn hội thoại đầu tiên nếu chưa có activeConv
    useEffect(() => {
        if (convs && convs.length > 0 && !activeConv) {
            setActiveConv(convs[0]);
        }
    }, [convs, activeConv]);
    
    // Nếu widget ĐÓNG → tính badge = tổng unread_for_user
    useEffect(() => {
        if (!open && convs && convs.length > 0) {
            const totalUnread = convs.reduce(
                (sum, c) => sum + (c.unread_for_user || 0),
                0
            );
            setUnreadBadge(totalUnread);
        }
    }, [convs, open]);

    // ===== LẤY MESSAGE CỦA HỘI THOẠI ACTIVE =====
    const {
        data: messagesData,
        isLoading: msgLoading,
    } = useQuery<{ conversation: SupportConversation; messages: SupportMessage[] }>(
        {
            queryKey: ["user-support-messages", activeConv?._id],
            queryFn: () => fetchMySupportMessages(activeConv!._id),
            enabled: !!activeConv?._id && open, // chỉ fetch khi mở widget
        }
    );
    const handleChangeInput = (e: any) => {
        const value = e.target.value;
        setInput(value);

        if (!socket || !activeConv?._id) return;

        socket.emit("user:typing", {
            conversation_id: activeConv._id,
        });

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
            if (!socket || !activeConv?._id) return;
            socket.emit("user:stop_typing", {
                conversation_id: activeConv._id,
            });
        }, 1000);
    };
    useEffect(() => {
        if (!socket) return;
        if (!activeConv?._id) return;

        const handleTyping = (payload: any) => {
            console.log("ADMIN TYPING EVENT", payload);
            if (payload.conversation_id === activeConv._id && payload.sender_type === "admin") {
                setIsAdminTyping(true);
            }
        };

        const handleStopTyping = (payload: any) => {
            if (payload.conversation_id === activeConv._id && payload.sender_type === "admin") {
                setIsAdminTyping(false);
            }
        };

        socket.on("chat:typing", handleTyping);
        socket.on("chat:stop_typing", handleStopTyping);

        return () => {
            socket.off("chat:typing", handleTyping);
            socket.off("chat:stop_typing", handleStopTyping);
        };
    }, [socket, activeConv?._id]);
    const sendMutation = useMutation({
        mutationFn: (content: string) =>
            sendUserSupportMessage(activeConv?._id || null, content),
        onSuccess: () => {
            setInput("");
            // refetch list hội thoại (badge, preview, ...)
            queryClient.invalidateQueries({
                queryKey: ["user-support-conversations"],
            });
            // refetch messages của hội thoại hiện tại
            if (activeConv) {
                queryClient.invalidateQueries({
                    queryKey: ["user-support-messages", activeConv._id],
                });
            }
        },
    });

    const sending = sendMutation.isPending;
    const messages = messagesData?.messages || [];


    useEffect(() => {
        if (!open) return;
        if (!messagesEndRef.current) return;

        messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [
        messages.length,  // tin nhắn mới
        isAdminTyping,    // hiện / tắt dấu chấm
        open
    ]);
    const sendMediaMutation = useMutation({
        mutationFn: (file: RcFile) => sendUserSupportMedia(file),
        onSuccess: () => {
            // refetch để cập nhật message & preview
            queryClient.invalidateQueries({
                queryKey: ["user-support-conversations"],
            });
            if (activeConv) {
                queryClient.invalidateQueries({
                    queryKey: ["user-support-messages", activeConv._id],
                });
            }
        },
    });
    const handleSend = () => {
        if (!input.trim()) return;
        sendMutation.mutate(input.trim());
    };

    const handleToggleOpen = () => {
        setOpen((prev) => !prev);
        // mở widget thì clear badge
        if (!open) setUnreadBadge(0);
    };

    return (
        <>
            {/* Nút chat nổi */}
            <div className="fixed bottom-[80px] right-6 z-40">
                <Tooltip title="Hỗ trợ khách hàng">
                    <Badge count={unreadBadge} size="small">
                        <Button
                            type="primary"
                            shape="circle"
                            size="large"
                            icon={<MessageOutlined />}
                            onClick={handleToggleOpen}
                        />
                    </Badge>
                </Tooltip>
            </div>

            {/* Panel chat */}
            {open && (
                <div className="fixed bottom-20 right-6 z-40 w-[320px] md:w-[380px]">
                    <Card
                        size="small"
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <MessageOutlined className="text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">
                                            Hỗ trợ khách hàng
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            Thắc mắc gì cứ nhắn cho shop nhé
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={handleToggleOpen}
                                />
                            </div>
                        }
                        bodyStyle={{ padding: 0 }}
                        className="shadow-xl rounded-xl overflow-hidden"
                    >
                        <div className="flex flex-col h-[420px]">
                            {/* Nội dung */}
                            {convLoading && !activeConv ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Spin />
                                </div>
                            ) : msgLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Spin />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                                    {messages.length === 0 ? (
                                        <div className="flex h-full items-center justify-center">
                                            <Empty
                                                description="Chưa có tin nhắn"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((m) => {
                                                const isUser = m.sender_type === "user";
                                                const isMedia = m.type === "image" || m.type === "video"; // 🔥 thêm dòng này
                                                return (
                                                    <div
                                                        key={m._id}
                                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isMedia
                                                                ? "bg-transparent text-gray-800" // media thì không nền màu
                                                                : isUser
                                                                    ? "bg-blue-500 text-white"
                                                                    : "bg-gray-100 text-gray-800"
                                                                }`}
                                                        >
                                                            {/* TEXT */}
                                                            {m.type === "text" && (
                                                                <div className="whitespace-pre-wrap break-words">
                                                                    {m.content}
                                                                </div>
                                                            )}

                                                            {/* IMAGE */}
                                                            {m.type === "image" && m.media_url && (
                                                                <img
                                                                    src={m.media_url}
                                                                    alt="[Hình ảnh]"
                                                                    className="max-w-full rounded-lg cursor-pointer"
                                                                    onClick={() => window.open(m.media_url!, "_blank")}
                                                                />
                                                            )}

                                                            {/* VIDEO */}
                                                            {m.type === "video" && m.media_url && (
                                                                <video
                                                                    src={m.media_url}
                                                                    controls
                                                                    className="max-w-full rounded-lg"
                                                                />
                                                            )}

                                                            <div className="mt-1 text-[10px] opacity-75 text-right">
                                                                {formatDistanceToNow(new Date(m.createdAt), {
                                                                    addSuffix: true,
                                                                    locale: vi,
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isAdminTyping && (
                                                <div className="flex justify-start">
                                                    <div className="bg-transparent rounded-2xl px-3 py-2 shadow-sm inline-block">
                                                        <TypingDots />
                                                    </div>
                                                </div>
                                            )}
                                            {/* điểm neo để scroll tới cuối */}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Thanh nhập */}
                            <div className="border-t bg-white p-2">
                                <div className="flex items-center gap-2">
                                    {/* nút chọn file - chỉ UI (chưa làm backend) */}
                                    <Upload
                                        multiple={false}
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            // gửi luôn qua mutation, không để antd tự upload
                                            sendMediaMutation.mutate(file as any);
                                            return false; // chặn upload mặc định
                                        }}
                                    >
                                        <Tooltip title="Gửi ảnh / video">
                                            <Button
                                                icon={<PaperClipOutlined />}
                                                loading={sendMediaMutation.isPending}
                                            />
                                        </Tooltip>
                                    </Upload>

                                    <TextArea
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        value={input}
                                        onChange={handleChangeInput}
                                        placeholder="Nhập tin nhắn…"
                                        onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />

                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<SendOutlined />}
                                        onClick={handleSend}
                                        loading={sending}
                                        disabled={!input.trim()}
                                    />
                                </div>
                                <div className="mt-1 text-[11px] text-gray-400">
                                    Nhấn <b>Enter</b> để gửi, <b>Shift + Enter</b> để xuống dòng
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};
