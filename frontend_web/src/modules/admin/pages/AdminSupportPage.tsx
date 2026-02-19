/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AdminSupportPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    Empty,
    Input,
    Button,
    Spin,
    Tag,
    List,
    Badge,
    Popconfirm,
    message,
    Tooltip,
    Upload,
} from "antd";
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
import type { RcFile } from "antd/es/upload";
import { useSocket } from "@/hooks/use-socket";
import { TypingDots } from "@/modules/user/components/ChatTypingIndicator";
import { useAdminSupportBadgeStore } from "@/hooks/use-admin-support-badge";
import { useIsMobile } from "@/hooks/use-is-mobile";

const { TextArea } = Input;

export const AdminSupportPage = () => {
    const isMobile = useIsMobile();
    const socket = useSocket();
    const { conversationId } = useParams<{ conversationId?: string }>();
    const [activeId, setActiveId] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const [convSearch, setConvSearch] = useState("");

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [isUserTyping, setIsUserTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // reset badge khi vào trang
    const resetNotif = useAdminNotificationStore((s) => s.reset);
    const setUnreadChatCount = useAdminSupportBadgeStore((s) => s.setUnreadChatCount);
    const resetChatUnread = useAdminSupportBadgeStore((s) => s.resetUnread);

    useEffect(() => {
        resetNotif();
        resetChatUnread();
    }, [resetNotif, resetChatUnread]);

    // conversations
    const { data: convs, isLoading: convLoading } = useQuery<SupportConversation[]>({
        queryKey: ["admin-support-conversations"],
        queryFn: fetchAdminSupportConversations,
    });

    // update tổng unread
    useEffect(() => {
        if (!convs) {
            setUnreadChatCount(0);
            return;
        }
        const totalUnread = convs.reduce((sum, c) => sum + (c.unread_for_admin || 0), 0);
        setUnreadChatCount(totalUnread);
    }, [convs, setUnreadChatCount]);

    // Messenger behavior:
    useEffect(() => {
        setActiveId(conversationId ?? null);
    }, [conversationId]);

    // messages
    const { data: messagesData, isLoading: msgLoading } = useQuery<{
        conversation: SupportConversation;
        messages: SupportMessage[];
    }>({
        queryKey: ["admin-support-messages", activeId],
        queryFn: () => fetchAdminSupportMessages(activeId as string),
        enabled: !!activeId,
    });

    const activeConv = messagesData?.conversation;
    const messages = messagesData?.messages || [];

    // typing events from user
    useEffect(() => {
        if (!socket || !activeId) return;

        const handleTyping = (payload: any) => {
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

        socket.emit("admin:typing", { conversation_id: activeConv._id, user_id: userId });

        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => {
            if (!socket || !activeConv?._id) return;
            socket.emit("admin:stop_typing", { conversation_id: activeConv._id, user_id: userId });
        }, 1000);
    };

    const sendMutation = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) => sendAdminSupportMessage(id, content),
        onSuccess: (data) => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: ["admin-support-messages", data.conversation._id] });
            queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminSupportConversation(id),
        onSuccess: () => {
            message.success("Đã xoá hội thoại");
            queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
            navigate("/admin/conversations");
        },
    });

    const sendMediaMutation = useMutation({
        mutationFn: ({ id, file }: { id: string; file: RcFile }) => sendAdminSupportMedia(id, file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-support-messages", data.conversation._id] });
            queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
        },
    });

    const handleSend = () => {
        if (!activeId || !input.trim()) return;
        sendMutation.mutate({ id: activeId, content: input.trim() });
    };

    const handleSelectConversation = (id: string) => {
        navigate(`/admin/conversations/${id}`);

        // optimistic unread reset
        queryClient.setQueryData<SupportConversation[]>(["admin-support-conversations"], (old) => {
            if (!old) return old;
            return old.map((c) => (c._id === id ? { ...c, unread_for_admin: 0 } : c));
        });
    };

    // auto scroll bottom
    useEffect(() => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length, isUserTyping, activeId]);

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

    const filteredConvs = useMemo(() => {
        const s = convSearch.trim().toLowerCase();
        if (!s) return convs || [];
        return (convs || []).filter((c) => {
            const u: any = c.user_id;
            const name = (u?.display_name || "").toLowerCase();
            const email = (u?.email || "").toLowerCase();
            const preview = (c.last_message_preview || "").toLowerCase();
            return name.includes(s) || email.includes(s) || preview.includes(s);
        });
    }, [convs, convSearch]);

    // mobile: mặc định chỉ list, chọn xong mới vào chat full màn
    const showListOnly = isMobile && !activeId;
    const showChatOnly = isMobile && !!activeId;

    return (
        <div
            className={`w-full max-w-full overflow-x-hidden h-full min-h-0 flex ${isMobile ? "gap-0" : "gap-4"
                }`}
        >
            {/* SIDEBAR */}
            {!showChatOnly && (
                <Card
                    title="Hỗ trợ khách hàng"
                    className={`${isMobile ? "w-full" : "w-80"} min-w-0 flex-shrink-0 h-full overflow-hidden flex flex-col`}
                    bodyStyle={{ padding: 0 }}
                >
                    <div className="p-3 border-b">
                        <Input
                            placeholder="Tìm hội thoại..."
                            value={convSearch}
                            onChange={(e) => setConvSearch(e.target.value)}
                            allowClear
                        />
                    </div>

                    <div className="flex-1 min-h-0">
                        {convLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Spin />
                            </div>
                        ) : !filteredConvs || filteredConvs.length === 0 ? (
                            <div className="h-full flex items-center justify-center p-4">
                                <Empty description="Chưa có hội thoại nào" />
                            </div>
                        ) : (
                            <List
                                className="h-full overflow-y-auto"
                                itemLayout="horizontal"
                                dataSource={filteredConvs}
                                renderItem={(conv) => {
                                    const u: any = conv.user_id;
                                    const isActive = activeId === conv._id;

                                    return (
                                        <List.Item
                                            className={`cursor-pointer !px-[14px] rounded-lg py-2 ${isActive ? "bg-blue-100" : ""
                                                } hover:bg-blue-50`}
                                            onClick={() => handleSelectConversation(conv._id)}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Badge count={conv.unread_for_admin} size="small">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={u?.avatar_url} alt={u?.display_name} />
                                                            <AvatarFallback>{getInitials(u?.display_name)}</AvatarFallback>
                                                        </Avatar>
                                                    </Badge>
                                                }
                                                title={
                                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                                        <span className="font-medium text-sm truncate max-w-[150px]">
                                                            {u?.display_name || "Khách hàng"}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 shrink-0">
                                                            {conv.last_message_at
                                                                ? formatDistanceToNow(new Date(conv.last_message_at), {
                                                                    addSuffix: true,
                                                                    locale: vi,
                                                                })
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
            )}

            {/* CHAT PANEL */}
            {!showListOnly && (
                <Card
                    className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden"
                    // ✅ QUAN TRỌNG: body cũng phải flex-column thì input mới “dính đáy” được
                    bodyStyle={{
                        padding: 0,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                    }}
                >
                    {/* header */}
                    <div className="shrink-0 border-b bg-white px-3 py-2">
                        {activeConv ? (
                            <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isMobile && <Button onClick={() => navigate("/admin/conversations")}>Back</Button>}

                                    <div className="min-w-0">
                                        <div className="font-semibold truncate max-w-[60vw]">
                                            {typeof activeConv.user_id === "object"
                                                ? (activeConv.user_id as any).display_name
                                                : "Khách hàng"}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-[60vw]">
                                            {typeof activeConv.user_id === "object" ? (activeConv.user_id as any).email : ""}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {getStatusTag(activeConv.status)}
                                    <Popconfirm
                                        title="Xoá hội thoại này?"
                                        description="Tất cả tin nhắn trong hội thoại sẽ bị xoá. Bạn chắc chắn?"
                                        okText="Xoá"
                                        cancelText="Huỷ"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => activeId && deleteMutation.mutate(activeId)}
                                    >
                                        <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                                    </Popconfirm>
                                </div>
                            </div>
                        ) : (
                            <div className="font-semibold">Chi tiết hội thoại</div>
                        )}
                    </div>

                    {/* content */}
                    {!activeId ? (
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            <Empty description="Chọn một hội thoại để xem chi tiết" />
                        </div>
                    ) : msgLoading ? (
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            <Spin />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                            {/* messages */}
                            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-slate-50">
                                {messages.map((m) => {
                                    const isAdmin = m.sender_type === "admin";
                                    const isMedia = m.type === "image" || m.type === "video";

                                    return (
                                        <div key={m._id} className={`flex max-w-full ${isAdmin ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] min-w-0 ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                                <div
                                                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm min-w-0 ${isMedia
                                                            ? "bg-transparent shadow-none"
                                                            : isAdmin
                                                                ? "bg-blue-500 text-white"
                                                                : "bg-white text-gray-900"
                                                        }`}
                                                >
                                                    {m.type === "text" && <div className="whitespace-pre-wrap break-words">{m.content}</div>}

                                                    {m.type === "image" && (m as any).media_url && (
                                                        <img
                                                            src={(m as any).media_url}
                                                            alt="[Hình ảnh]"
                                                            className="max-w-full h-auto rounded-2xl cursor-pointer"
                                                            onClick={() => window.open((m as any).media_url!, "_blank")}
                                                        />
                                                    )}

                                                    {m.type === "video" && (m as any).media_url && (
                                                        <video src={(m as any).media_url} controls className="max-w-full rounded-2xl" />
                                                    )}
                                                </div>

                                                <div className="text-[10px] text-gray-400">
                                                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: vi })}
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
                                        <div className="bg-transparent rounded-lg px-2 py-1 inline-block">
                                            <TypingDots />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* input */}
                            <div className="shrink-0 border-t bg-white p-3 min-w-0">
                                <div className="flex items-end gap-2 w-full max-w-full min-w-0">
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
                                            <Button icon={<PaperClipOutlined />} loading={sendMediaMutation.isPending} />
                                        </Tooltip>
                                    </Upload>

                                    <TextArea
                                        className="flex-1 min-w-0"
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
                                        {!isMobile ? "Gửi" : null}
                                    </Button>
                                </div>

                                {!isMobile && (
                                    <div className="mt-1 text-[11px] text-gray-400">
                                        Nhấn <b>Enter</b> để gửi, <b>Shift + Enter</b> để xuống dòng
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default AdminSupportPage;
