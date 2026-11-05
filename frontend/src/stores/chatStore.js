import { create } from 'zustand';

const initialState = {
    conversations: [],
    activeConversation: null,
    messages: {},
    typingUsers: {},
    onlineUsers: new Set(),
    unreadCounts: {},
};

export const useChatStore = create((set, get) => ({
    ...initialState,

    setConversations: (conversations) => set({ conversations }),

    setActiveConversation: (userId) => {
        const unreadCounts = { ...get().unreadCounts };
        if (userId) delete unreadCounts[userId];
        set({ activeConversation: userId, unreadCounts });
    },

    setUnreadCounts: (counts) => {
        // The open conversation is always considered read
        const { activeConversation } = get();
        const next = { ...counts };
        if (activeConversation) delete next[activeConversation];
        set({ unreadCounts: next });
    },

    addMessage: (message, currentUserId = null) => {
        if (!message) return;
        const { activeConversation } = get();

        // The conversation partner is the OTHER person in the conversation
        const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        const existing = get().messages[otherUserId] || [];

        // De-duplicate: the same message can arrive from the REST response AND the socket
        if (message.id && existing.some((m) => m.id === message.id)) return;

        set((state) => ({
            messages: {
                ...state.messages,
                [otherUserId]: [...existing, message],
            },
        }));

        const isReceivedMessage = currentUserId && message.senderId !== currentUserId;
        // Only "read" if that chat is open AND the user is actually on the Messages page
        const onMessagesPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/messages');
        const isConversationActive = onMessagesPage && otherUserId === activeConversation;

        if (isReceivedMessage && !isConversationActive) {
            set((state) => ({
                unreadCounts: {
                    ...state.unreadCounts,
                    [message.senderId]: (state.unreadCounts[message.senderId] || 0) + 1,
                },
            }));
        }
    },

    setMessages: (userId, messages) => {
        set((state) => ({
            messages: {
                ...state.messages,
                [userId]: messages,
            },
        }));
    },

    setTyping: (userId, isTyping) => {
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [userId]: isTyping,
            },
        }));
    },

    setOnlineUsers: (users) => {
        set({ onlineUsers: new Set(users) });
    },

    addOnlineUser: (userId) => {
        set((state) => ({
            onlineUsers: new Set([...state.onlineUsers, userId]),
        }));
    },

    removeOnlineUser: (userId) => {
        set((state) => {
            const onlineUsers = new Set(state.onlineUsers);
            onlineUsers.delete(userId);
            return { onlineUsers };
        });
    },

    clearChat: () => {
        set({
            activeConversation: null,
            messages: {},
            typingUsers: {},
        });
    },

    reset: () => set({ ...initialState, onlineUsers: new Set() }),
}));
