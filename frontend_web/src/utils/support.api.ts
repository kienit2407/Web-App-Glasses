// src/app/services/support.api.ts
import { API } from "@/app/lib/axios-client";
import { SupportConversation, SupportMessage } from "@/types/support";
import { RcFile } from "antd/es/upload";

/** ========== USER ========== */

export async function fetchMySupportConversations(): Promise<SupportConversation[]> {
    const res = await API.get("/support/conversations");
    return res.data.data;
}

export async function fetchMySupportMessages(conversationId: string): Promise<{
    conversation: SupportConversation;
    messages: SupportMessage[];
}> {
    const res = await API.get(`/support/conversations/${conversationId}/messages`);
    return res.data.data;
}

export async function sendUserSupportMessage(conversationId: string | null, content: string) {
    // backend đang luôn "tìm hoặc tạo" conv dựa trên user,
    // nên FE có thể chỉ cần POST /support/messages với content
    const res = await API.post("/support/messages", { content });
    return res.data.data as { conversation: SupportConversation; message: SupportMessage };
}

/** ========== ADMIN ========== */

export async function fetchAdminSupportConversations(): Promise<SupportConversation[]> {
    const res = await API.get("/admin/support/conversations");
    return res.data.data;
}

export async function fetchAdminSupportMessages(
    conversationId: string
): Promise<{ conversation: SupportConversation; messages: SupportMessage[] }> {
    const res = await API.get(`/admin/support/conversations/${conversationId}/messages`);
    return res.data.data;
}

export async function sendAdminSupportMessage(conversationId: string, content: string) {
    const res = await API.post(`/admin/support/conversations/${conversationId}/messages`, {
        content,
    });
    return res.data.data as { conversation: SupportConversation; message: SupportMessage };
}

export const deleteAdminSupportConversation = async (id: string) => {
    const res = await API.delete(`/admin/support/conversations/${id}`);
    return res.data?.data;
};
export const sendAdminSupportMedia = async (conversationId: string, file: RcFile) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await API.post(
        `/admin/support/conversations/${conversationId}/media`,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
        }
    );

    return res.data.data;
};
export const sendUserSupportMedia = async (file: RcFile) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await API.post("/support/messages/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.data;
};
