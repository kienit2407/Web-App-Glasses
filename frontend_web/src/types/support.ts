// src/types/support.ts
export type TConversationStatus = "open" | "pending" | "closed";
export type SupportMessageType = "text" | "image" | "video";
export type SupportSenderType = "user" | "admin" | "system";
export interface SupportConversation {
    _id: string;
    user_id?: {
        _id: string;
        display_name: string;
        email: string;
    } | string;
    assigned_admin_id?: string | null;
    status: TConversationStatus;
    last_message_at: string;
    last_message_preview: string;
    unread_for_admin: number;
    unread_for_user: number;
}

export interface SupportMessage {
    _id: string;
    conversation_id: string;
    sender_type: SupportSenderType;
    sender_id?: string | null;

    // 🔥 thêm mấy field này
    type: SupportMessageType;       // "text" | "image" | "video"
    content: string;                // text
    media_url?: string | null;      // link ảnh/video
    media_thumb?: string | null;    // nếu sau này có thumbnail

    createdAt: string;
    updatedAt: string;
}