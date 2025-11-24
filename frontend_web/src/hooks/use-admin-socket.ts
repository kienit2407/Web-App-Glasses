// src/hooks/use-admin-socket.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useSocket } from "./use-socket";
import { useAuth } from "./use-auth";
import { useAdminNotificationStore } from "./use-admin-notification";
import { useQueryClient } from "@tanstack/react-query";
import { SupportConversation } from "@/types/support";

export const useAdminSocket = () => {
    const socket = useSocket();
    const { user } = useAuth();
    const increase = useAdminNotificationStore((s) => s.increase);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket || !user || !user.roles?.includes("admin")) return;

        const audioChat = new Audio("/chat.mp3");
        const audioOrder = new Audio("/notification_sound.mp3");
        const playSoundChat = () => {
            audioChat.currentTime = 0;
            audioChat.play().catch((err) => console.log("Cannot play notification sound:", err));
        };
        const playSoundOrder = () => {
            audioOrder.currentTime = 0;
            audioOrder.play().catch((err) => console.log("Cannot play notification sound:", err));
        };

        const handleNewOrder = (payload: any) => {
            console.log("Admin received new order:", payload);
            increase(1);
            playSoundOrder();
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        };

        const handleCancelRequested = (payload: any) => {
            console.log("Admin received cancel request:", payload);
            increase(1);
            playSoundOrder();
        };

        const handleReturnRequested = (payload: any) => {
            console.log("Admin received return request:", payload);
            increase(1);
            playSoundOrder();
        };


        const handleChatNewMessage = (payload: any) => {
            console.log("Admin received chat message:", payload);

            playSoundChat();

            // queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
            // if (payload?.conversation_id) {
            //     queryClient.invalidateQueries({
            //         queryKey: ["admin-support-messages", payload.conversation_id],
            //     });
            // }
            queryClient.setQueryData<SupportConversation[]>(
                ["admin-support-conversations"],
                (old) => {
                    if (!old) return old;
                    return old.map((c) =>
                        String(c._id) === String(payload.conversation_id)
                            ? {
                                ...c,
                                unread_for_admin: (c.unread_for_admin || 0) + 1,
                                last_message_at: payload.createdAt ?? c.last_message_at,
                                last_message_preview: payload.preview ?? c.last_message_preview,
                            }
                            : c
                    );
                }
            );
        };

        // đăng ký join room admins (nếu chưa)
        socket.emit("register_admin");

        socket.on("admin:order:new", handleNewOrder);
        socket.on("admin:order:cancel_requested", handleCancelRequested);
        socket.on("admin:order:return_requested", handleReturnRequested);
        socket.on("admin:chat:new_message", handleChatNewMessage);

        return () => {
            socket.off("admin:order:new", handleNewOrder);
            socket.off("admin:order:cancel_requested", handleCancelRequested);
            socket.off("admin:order:return_requested", handleReturnRequested);
            socket.off("admin:chat:new_message", handleChatNewMessage);
        };
    }, [socket, user, increase, queryClient]);
};
