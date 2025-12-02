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
    Tabs,
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
import { API } from "@/app/lib/axios-client";

const { TextArea } = Input;

// ====== TYPE BOT MESSAGE ======
type BotMessage = {
    id: string;
    from: "user" | "bot";
    content: string;
    createdAt: string;
};



export const SupportChatWidget = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"bot" | "support">("bot");

    // ====== SUPPORT (ADMIN) STATE ======
    const [activeConv, setActiveConv] = useState<SupportConversation | null>(null);
    const [supportInput, setSupportInput] = useState("");
    const [unreadBadge, setUnreadBadge] = useState(0);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const supportMessagesEndRef = useRef<HTMLDivElement | null>(null);

    // ====== BOT STATE ======
    const [botInput, setBotInput] = useState("");
    const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
    const botMessagesEndRef = useRef<HTMLDivElement | null>(null);

    // ===== LẤY DANH SÁCH HỘI THOẠI CỦA USER (SUPPORT) =====
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
                0,
            );
            setUnreadBadge(totalUnread);
        }
    }, [convs, open]);

    // ===== LẤY MESSAGE CỦA HỘI THOẠI ACTIVE (SUPPORT) =====
    const {
        data: messagesData,
        isLoading: msgLoading,
    } = useQuery<{ conversation: SupportConversation; messages: SupportMessage[] }>(
        {
            queryKey: ["user-support-messages", activeConv?._id],
            queryFn: () => fetchMySupportMessages(activeConv!._id),
            enabled: !!activeConv?._id && open, // chỉ fetch khi mở widget
        },
    );

    const messages = messagesData?.messages || [];

    // ====== INPUT CHANGE (SUPPORT) + TYPING SOCKET ======
    const handleChangeSupportInput = (e: any) => {
        const value = e.target.value;
        setSupportInput(value);

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
    const sendBotChatMessage = async (message: string, history: BotMessage[]): Promise<{
        intent: string;
        answer: string;
    }> => {
        const res = await API.post("/trap-bot/chat", {
            message: message,
            history: history.map(m => ({
                from: m.from,
                content: m.content,
            })),
        })
        return res.data.data; // { intent, answer }
    }

    useEffect(() => {
        if (!socket) return;
        if (!activeConv?._id) return;

        const handleTyping = (payload: any) => {
            console.log("ADMIN TYPING EVENT", payload);
            if (
                payload.conversation_id === activeConv._id &&
                payload.sender_type === "admin"
            ) {
                setIsAdminTyping(true);
            }
        };

        const handleStopTyping = (payload: any) => {
            if (
                payload.conversation_id === activeConv._id &&
                payload.sender_type === "admin"
            ) {
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

    // ====== SEND MESSAGE SUPPORT ======
    const sendSupportMutation = useMutation({
        mutationFn: (content: string) =>
            sendUserSupportMessage(activeConv?._id || null, content),
        onSuccess: () => {
            setSupportInput("");
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

    const sendingSupport = sendSupportMutation.isPending;

    const handleSendSupport = () => {
        if (!supportInput.trim()) return;
        sendSupportMutation.mutate(supportInput.trim());
    };

    // ====== AUTO SCROLL SUPPORT ======
    useEffect(() => {
        if (!open) return;
        if (activeTab !== "support") return;
        if (!supportMessagesEndRef.current) return;

        supportMessagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages.length, isAdminTyping, open, activeTab]);

    // ====== SEND MEDIA SUPPORT ======
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

    // ====== SEND MESSAGE BOT ======
    const botMutation = useMutation({
        mutationFn: (content: string) => sendBotChatMessage(content, botMessages),
        onSuccess: (data) => {
            // thêm message BOT trả lời
            setBotMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-bot`,
                    from: "bot",
                    content: data.answer,
                    createdAt: new Date().toISOString(),
                },
            ]);
        },
    });

    const sendingBot = botMutation.isPending;

    const handleSendBot = () => {
        if (!botInput.trim()) return;
        const content = botInput.trim();

        // thêm message USER trước cho mượt
        setBotMessages((prev) => [
            ...prev,
            {
                id: `${Date.now()}-user`,
                from: "user",
                content,
                createdAt: new Date().toISOString(),
            },
        ]);
        setBotInput("");
        botMutation.mutate(content);
    };

    // ====== AUTO SCROLL BOT ======
    useEffect(() => {
        if (!open) return;
        if (activeTab !== "bot") return;
        if (!botMessagesEndRef.current) return;

        botMessagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [botMessages.length, sendingBot, open, activeTab]);

    // ====== TOGGLE WIDGET ======
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
                <div className="fixed bottom-20 right-6 z-40 w-[520px] md:w-[500px]">
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
                                            Hỗ trợ & tư vấn
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            Chat với admin hoặc trợ lý AI của shop
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
                        <div className="flex flex-col h-[680px]">

                            <Tabs
                                className="pl-5"
                                activeKey={activeTab}
                                onChange={(key) =>
                                    setActiveTab(key as "support" | "bot")
                                }
                                items={[
                                    {
                                        key: "bot",
                                        label: "Chat với trợ lý AI",
                                    },
                                    {
                                        key: "support",
                                        label: "Nhắn với admin",
                                    },
                                ]}
                            />

                            <div className="flex-1 min-h-0 flex-col-reverse">
                                {activeTab === "support" ? (
                                    // ====== PANEL SUPPORT (ADMIN) ======
                                    <>
                                        {convLoading && !activeConv ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <Spin />
                                            </div>
                                        ) : msgLoading ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <Spin />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full">
                                                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                                                    {messages.length === 0 ? (
                                                        <div className="flex h-full items-center justify-center">
                                                            <Empty
                                                                description="Chưa có tin nhắn với admin"
                                                                image={
                                                                    Empty.PRESENTED_IMAGE_SIMPLE
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {messages.map((m) => {
                                                                const isUser =
                                                                    m.sender_type ===
                                                                    "user";
                                                                const isMedia =
                                                                    m.type ===
                                                                    "image" ||
                                                                    m.type ===
                                                                    "video";
                                                                return (
                                                                    <div
                                                                        key={
                                                                            m._id
                                                                        }
                                                                        className={`flex ${isUser
                                                                            ? "justify-end"
                                                                            : "justify-start"
                                                                            }`}
                                                                    >
                                                                        <div
                                                                            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isMedia
                                                                                ? "bg-transparent text-gray-800"
                                                                                : isUser
                                                                                    ? "bg-blue-500 text-white"
                                                                                    : "bg-gray-100 text-gray-800"
                                                                                }`}
                                                                        >
                                                                            {/* TEXT */}
                                                                            {m.type ===
                                                                                "text" && (
                                                                                    <div className="whitespace-pre-wrap break-words">
                                                                                        {
                                                                                            m.content
                                                                                        }
                                                                                    </div>
                                                                                )}

                                                                            {/* IMAGE */}
                                                                            {m.type ===
                                                                                "image" &&
                                                                                m.media_url && (
                                                                                    <img
                                                                                        src={
                                                                                            m.media_url
                                                                                        }
                                                                                        alt="[Hình ảnh]"
                                                                                        className="max-w-full rounded-lg cursor-pointer"
                                                                                        onClick={() =>
                                                                                            window.open(
                                                                                                m.media_url!,
                                                                                                "_blank",
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                )}

                                                                            {/* VIDEO */}
                                                                            {m.type ===
                                                                                "video" &&
                                                                                m
                                                                                    .media_url && (
                                                                                    <video
                                                                                        src={
                                                                                            m.media_url
                                                                                        }
                                                                                        controls
                                                                                        className="max-w-full rounded-lg"
                                                                                    />
                                                                                )}

                                                                            <div className="mt-1 text-[10px] opacity-75 text-right">
                                                                                {formatDistanceToNow(
                                                                                    new Date(
                                                                                        m.createdAt,
                                                                                    ),
                                                                                    {
                                                                                        addSuffix:
                                                                                            true,
                                                                                        locale: vi,
                                                                                    },
                                                                                )}
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
                                                            <div
                                                                ref={
                                                                    supportMessagesEndRef
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Thanh nhập SUPPORT */}
                                                <div className="border-t bg-white p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Upload
                                                            multiple={false}
                                                            showUploadList={false}
                                                            beforeUpload={(
                                                                file,
                                                            ) => {
                                                                // gửi luôn qua mutation, không để antd tự upload
                                                                sendMediaMutation.mutate(
                                                                    file as any,
                                                                );
                                                                return false; // chặn upload mặc định
                                                            }}
                                                        >
                                                            <Tooltip title="Gửi ảnh / video cho admin">
                                                                <Button
                                                                    icon={
                                                                        <PaperClipOutlined />
                                                                    }
                                                                    loading={
                                                                        sendMediaMutation.isPending
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        </Upload>

                                                        <TextArea
                                                            autoSize={{
                                                                minRows: 1,
                                                                maxRows: 3,
                                                            }}
                                                            value={supportInput}
                                                            onChange={
                                                                handleChangeSupportInput
                                                            }
                                                            placeholder="Nhập tin nhắn cho admin…"
                                                            onPressEnter={(
                                                                e,
                                                            ) => {
                                                                if (!e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSendSupport();
                                                                }
                                                            }}
                                                        />

                                                        <Button
                                                            type="primary"
                                                            shape="circle"
                                                            icon={<SendOutlined />}
                                                            onClick={
                                                                handleSendSupport
                                                            }
                                                            loading={
                                                                sendingSupport
                                                            }
                                                            disabled={
                                                                !supportInput.trim()
                                                            }
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-gray-400">
                                                        Nhấn <b>Enter</b> để gửi,{" "}
                                                        <b>Shift + Enter</b> để
                                                        xuống dòng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // ====== PANEL BOT (TRAP-BOT) ======
                                    <div className="flex flex-col h-full min-h-0">
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                                            {botMessages.length === 0 ? (
                                                <div className="flex h-full items-center justify-center">
                                                    <Empty
                                                        description="Chưa có cuộc trò chuyện với trợ lý AI"
                                                        image={
                                                            Empty.PRESENTED_IMAGE_SIMPLE
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    {botMessages.map((m) => {
                                                        const isUser = m.from === "user";
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                                            >
                                                                <div
                                                                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isUser
                                                                        ? "bg-blue-500 text-white"
                                                                        : "bg-emerald-50 text-gray-800"
                                                                        }`}
                                                                >
                                                                    <div className="whitespace-pre-wrap break-words">
                                                                        {m.content}
                                                                    </div>
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
                                                    {sendingBot && (
                                                        <div className="flex justify-start">
                                                            <div className="bg-transparent rounded-2xl px-3 py-2 shadow-sm inline-block">
                                                                <TypingDots />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div ref={botMessagesEndRef} />
                                                </>
                                            )}
                                        </div>

                                        {/* Thanh nhập BOT */}
                                        <div className="border-t bg-white p-2">
                                            <div className="flex items-center gap-2">
                                                <TextArea
                                                    autoSize={{
                                                        minRows: 1,
                                                        maxRows: 3,
                                                    }}
                                                    value={botInput}
                                                    onChange={(e) =>
                                                        setBotInput(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Hỏi trợ lý AI về kính, khuôn mặt, sản phẩm…"
                                                    onPressEnter={(e) => {
                                                        if (!e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendBot();
                                                        }
                                                    }}
                                                />

                                                <Button
                                                    type="primary"
                                                    shape="circle"
                                                    icon={<SendOutlined />}
                                                    onClick={handleSendBot}
                                                    loading={sendingBot}
                                                    disabled={!botInput.trim()}
                                                />
                                            </div>
                                            <div className="mt-1 text-[11px] text-gray-400">
                                                Trợ lý AI sẽ gợi ý theo tài liệu
                                                tư vấn khuôn mặt & kính của shop.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};
