/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AdminSupportPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Empty, Input, Button, Spin, Tag, List, Badge, Popconfirm, message, Tooltip } from "antd";
import { SendOutlined, DeleteOutlined, PaperClipOutlined } from "@ant-design/icons";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { useAdminNotificationStore } from "@/hooks/use-admin-notification";
import { SupportConversation, SupportMessage } from "@/types/support";
import {
    deleteAdminSupportConversation,
    fetchAdminSupportConversations,
    fetchAdminSupportMessages,
    sendAdminSupportMedia,
    sendAdminSupportMessage,
} from "@/utils/support.api";
import { getInitials } from "@/utils/fallback_for_avt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Upload, { RcFile } from "antd/es/upload";
import { useSocket } from "@/hooks/use-socket";
import { TypingDots } from "@/modules/user/components/ChatTypingIndicator";

const { TextArea } = Input;

export const AdminSupportPage = () => {
    const socket = useSocket()
    const { conversationId } = useParams<{ conversationId?: string }>();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isUserTyping, setIsUserTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    // ref để scroll giống Messenger
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // reset badge khi vào trang hỗ trợ
    const resetNotif = useAdminNotificationStore((s) => s.reset);

    useEffect(() => {
        resetNotif();
    }, [resetNotif]);

    // conversations
    const {
        data: convs,
        isLoading: convLoading,
    } = useQuery<SupportConversation[]>({
        queryKey: ["admin-support-conversations"],
        queryFn: fetchAdminSupportConversations,
    });

    useEffect(() => {
        if (conversationId) {
            setActiveId(conversationId);
        } else if (!conversationId && convs && convs.length > 0 && !activeId) {
            setActiveId(convs[0]._id);
        }
    }, [conversationId, convs, activeId]);

    // messages của hội thoại đang active
    const {
        data: messagesData,
        isLoading: msgLoading,
    } = useQuery<{ conversation: SupportConversation; messages: SupportMessage[] }>({
        queryKey: ["admin-support-messages", activeId],
        queryFn: () => fetchAdminSupportMessages(activeId as string),
        enabled: !!activeId,
    });

    useEffect(() => {
        if (!socket || !activeId) return;

        const handleTyping = (payload: any) => {
            console.log("ADMIN TYPING EVENT", payload);
            if (payload.conversation_id === activeId && payload.sender_type === "user") {
                setIsUserTyping(true);
            }
        };

        const handleStopTyping = (payload: any) => {
            if (payload.conversation_id === activeId && payload.sender_type === "user") {
                setIsUserTyping(false);
            }
        };

        socket.on("admin:chat:typing", handleTyping);
        socket.on("admin:chat:stop_typing", handleStopTyping);

        return () => {
            socket.off("admin:chat:typing", handleTyping);
            socket.off("admin:chat:stop_typing", handleStopTyping);
        };
    }, [socket, activeId]);
    const handleChangeInput = (e: any) => {
        const value = e.target.value;
        setInput(value);

        if (!socket || !activeConv?._id) return;

        const u: any = activeConv.user_id;
        const userId = typeof u === "object" ? u._id : null;
        if (!userId) return;

        socket.emit("admin:typing", {
            conversation_id: activeConv._id,
            user_id: userId,
        });

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
            if (!socket || !activeConv?._id) return;
            socket.emit("admin:stop_typing", {
                conversation_id: activeConv._id,
                user_id: userId,
            });
        }, 1000);
    };
    const sendMutation = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) =>
            sendAdminSupportMessage(id, content),
        onSuccess: (data) => {
            setInput("");
            // refetch messages & conversations
            queryClient.invalidateQueries({
                queryKey: ["admin-support-messages", data.conversation._id],
            });
            queryClient.invalidateQueries({
                queryKey: ["admin-support-conversations"],
            });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminSupportConversation(id),
        onSuccess: () => {
            message.success("Đã xoá hội thoại");
            // refetch danh sách hội thoại
            queryClient.invalidateQueries({
                queryKey: ["admin-support-conversations"],
            });
            // clear hội thoại đang active + về route list
            setActiveId(null);
            navigate("/admin/conversations");
        },
    });
    
    const handleSelectConversation = (id: string) => {
        setActiveId(id);
        navigate(`/admin/conversations/${id}`);

        // ✨ Optimistic: coi như đã đọc → tắt badge của conv này
        queryClient.setQueryData<SupportConversation[]>(
            ["admin-support-conversations"],
            (old) => {
                if (!old) return old;
                return old.map((c) =>
                    c._id === id ? { ...c, unread_for_admin: 0 } : c
                );
            }
        );
    };
    const sendMediaMutation = useMutation({
        mutationFn: ({ id, file }: { id: string; file: RcFile }) =>
            sendAdminSupportMedia(id, file),
        onSuccess: (data) => {
            // refetch messages & conversations
            queryClient.invalidateQueries({
                queryKey: ["admin-support-messages", data.conversation._id],
            });
            queryClient.invalidateQueries({
                queryKey: ["admin-support-conversations"],
            });
        },
    });
    const handleSend = () => {
        if (!activeId || !input.trim()) return;
        sendMutation.mutate({ id: activeId, content: input.trim() });
    };

    const activeConv = messagesData?.conversation;
    const messages = messagesData?.messages || [];

    useEffect(() => {
        if (!messagesEndRef.current) return;

        messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [
        messages.length,   // khi có tin nhắn mới
        isUserTyping,      // khi user bắt đầu/stop gõ, để thấy được dấu chấm
        activeId           // khi đổi hội thoại
    ]);

    const getStatusTag = (status?: string) => {
        if (!status) return null;
        switch (status) {
            case "open":
                return <Tag color="green">Đang mở</Tag>;
            case "pending":
                return <Tag color="orange">Đang chờ</Tag>;
            case "closed":
                return <Tag color="default">Đã đóng</Tag>;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex gap-4">
            <Card
                title="Hỗ trợ khách hàng"
                className="w-80 flex-shrink-0 h-full overflow-hidden flex flex-col"
                bodyStyle={{ padding: 0 }}
            >
                <div className="h-full flex flex-col">
                    {convLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Spin />
                        </div>
                    ) : !convs || convs.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <Empty description="Chưa có hội thoại nào" />
                        </div>
                    ) : (
                        <List
                            className="flex-1 overflow-y-auto"
                            itemLayout="horizontal"
                            dataSource={convs}
                            renderItem={(conv) => {
                                const u: any = conv.user_id;
                                const isActive = activeId === conv._id;

                                return (
                                    <List.Item
                                        className={`cursor-pointer !px-[14px] rounded-lg py-2 ${isActive ? "bg-blue-100" : ""} hover:bg-blue-50`}
                                        onClick={() => handleSelectConversation(conv._id)}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Badge count={conv.unread_for_admin} size="small">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarImage src={u?.avatar_url} alt={u?.display_name} />
                                                        <AvatarFallback>{getInitials(u?.display_name)}</AvatarFallback>
                                                    </Avatar>
                                                </Badge>
                                            }
                                            title={
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm truncate max-w-[120px]">
                                                        {u?.display_name || "Khách hàng"}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">
                                                        {conv.last_message_at
                                                            ? formatDistanceToNow(
                                                                new Date(conv.last_message_at),
                                                                {
                                                                    addSuffix: true,
                                                                    locale: vi,
                                                                }
                                                            )
                                                            : ""}
                                                    </span>
                                                </div>
                                            }
                                            description={
                                                <div className="text-xs text-gray-500 line-clamp-2">
                                                    {conv.last_message_preview || "(Chưa có nội dung)"}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </div>
            </Card>

            {/* CHAT PANEL */}
            <Card
                title={
                    activeConv ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold">
                                    {typeof activeConv.user_id === "object"
                                        ? (activeConv.user_id as any).display_name
                                        : "Khách hàng"}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {typeof activeConv.user_id === "object"
                                        ? (activeConv.user_id as any).email
                                        : ""}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {getStatusTag(activeConv.status)}
                                <Popconfirm
                                    title="Xoá hội thoại này?"
                                    description="Tất cả tin nhắn trong hội thoại sẽ bị xoá. Bạn chắc chắn?"
                                    okText="Xoá"
                                    cancelText="Huỷ"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => {
                                        if (activeId) {
                                            deleteMutation.mutate(activeId);
                                        }
                                    }}
                                >
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={deleteMutation.isPending}
                                    >
                                        Xoá
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                    ) : (
                        "Chi tiết hội thoại"
                    )
                }
                className="flex-1 flex flex-col h-full"
                bodyStyle={{ padding: 0, height: "100%" }}
            >
                {!activeId ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Empty description="Chọn một hội thoại ở bên trái để xem chi tiết" />
                    </div>
                ) : msgLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Spin />
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((m) => {
                                const isAdmin = m.sender_type === "admin";
                                const isMedia = m.type === "image" || m.type === "video";

                                return (
                                    <div
                                        key={m._id}
                                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isMedia
                                                ? "bg-transparent text-gray-800" // media thì không nền màu
                                                : isAdmin
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {/* TEXT */}
                                            {m.type === "text" && (
                                                <div className="whitespace-pre-wrap">{m.content}</div>
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
                                                <video src={m.media_url} controls className="max-w-full rounded-lg" />
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

                            {messages.length === 0 && (
                                <div className="h-full flex items-center justify-center">
                                    <Empty description="Chưa có tin nhắn" />
                                </div>
                            )}
                            {isUserTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-transparent rounded-lg px-3 py-2 inline-block">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}
                            {/* điểm neo để scroll tới cuối */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* input */}
                        <div className="border-t bg-white p-3 mb-10">
                            <div className="flex items-end gap-2">
                                <Upload
                                    multiple={false}
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        if (!activeId) return false;
                                        sendMediaMutation.mutate({ id: activeId, file: file as any });
                                        return false;
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
                                    className="flex-1"
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    value={input}
                                    onChange={handleChangeInput}
                                    placeholder="Nhập nội dung phản hồi…"
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />

                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSend}
                                    loading={sendMutation.isPending}
                                    disabled={!input.trim()}
                                >
                                    Gửi
                                </Button>
                            </div>

                            <div className="mt-1 text-[11px] text-gray-400">
                                Nhấn <b>Enter</b> để gửi, <b>Shift + Enter</b> để xuống dòng
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
