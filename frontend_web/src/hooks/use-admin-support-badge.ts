import { create } from "zustand";

interface AdminSupportBadgeState {
    unreadChatCount: number;
    setUnreadChatCount: (count: number) => void;
    increaseUnread: (delta?: number) => void;
    resetUnread: () => void;
}

export const useAdminSupportBadgeStore = create<AdminSupportBadgeState>((set) => ({
    unreadChatCount: 0,
    setUnreadChatCount: (count) => set({ unreadChatCount: count }),
    increaseUnread: (delta = 1) =>
        set((state) => ({
            unreadChatCount: state.unreadChatCount + delta,
        })),
    resetUnread: () => set({ unreadChatCount: 0 }),
}));
