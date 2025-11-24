// src/hooks/use-user-socket.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useSocket } from "./use-socket";
import { useAuth } from "./use-auth";
import { useUserNotificationStore } from "./use-user-notification";
import { useQueryClient } from "@tanstack/react-query";

export const useUserSocket = () => {
    const socket = useSocket();
    const { user } = useAuth();
    const fetchFirstPage = useUserNotificationStore((s) => s.fetchFirstPage);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket || !user) return;

        socket.onAny((event, ...args) => {
            console.log("[USER SOCKET EVENT]", event, args);
        });

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

        const refreshNotifications = async () => {
            await fetchFirstPage();
        };

        const handleStatusUpdated = (payload: any) => {
            console.log("USER received order:status_updated:", payload);
            playSoundOrder();
            refreshNotifications();
        };

        const handleCancelRequested = (payload: any) => {
            console.log("USER received order:cancel_requested:", payload);
            playSoundOrder();
            refreshNotifications();
        };

        const handleReturnRequested = (payload: any) => {
            console.log("USER received order:return_requested:", payload);
            playSoundOrder();
            refreshNotifications();
        };

        const handleChatNewMessage = (payload: any) => {
            console.log("USER received chat:new_message:", payload);
            playSoundChat();
            // cập nhật badge widget (conversations)
            queryClient.invalidateQueries({
                queryKey: ["user-support-conversations"],
            });
            if (payload?.conversation_id) {
                queryClient.invalidateQueries({
                    queryKey: ["user-support-messages", payload.conversation_id],
                });
            }
        };

        socket.on("order:status_updated", handleStatusUpdated);
        socket.on("order:cancel_requested", handleCancelRequested);
        socket.on("order:return_requested", handleReturnRequested);

        // 🔥 chat realtime
        socket.on("chat:new_message", handleChatNewMessage);

        return () => {
            socket.off("order:status_updated", handleStatusUpdated);
            socket.off("order:cancel_requested", handleCancelRequested);
            socket.off("order:return_requested", handleReturnRequested);
            socket.off("chat:new_message", handleChatNewMessage);
        };
    }, [socket, user, fetchFirstPage, queryClient]);
};
