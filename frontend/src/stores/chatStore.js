import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: {},
    typingUsers: {},
    onlineUsers: new Set(),
    unreadCounts: {},

    setConversations: (conversations) => set({ conversations }),

    setActiveConversation: (userId) => {
        set({ activeConversation: userId });
        // Mark messages as read when opening conversation
        const unreadCounts = { ...get().unreadCounts };
        delete unreadCounts[userId];
        set({ unreadCounts });
    },

    setUnreadCounts: (counts) => {
        set({ unreadCounts: counts });
    },

    addMessage: (message, currentUserId = null) => {
        const { activeConversation, unreadCounts } = get();

        // Determine the conversation partner (the OTHER person in the conversation)
        const otherUserId = message.senderId === currentUserId
            ? message.receiverId  // If I sent it, conversation is with receiver
            : message.senderId;   // If I received it, conversation is with sender

        set((state) => ({
            messages: {
                ...state.messages,
                [otherUserId]: [...(state.messages[otherUserId] || []), message],
            },
        }));

        // Only increment unread count if:
        // 1. I am NOT the sender (I received this message)
        // 2. AND this conversation is not currently active/open
        const isReceivedMessage = currentUserId && message.senderId !== currentUserId;
        const isConversationActive = otherUserId === activeConversation;

        if (isReceivedMessage && !isConversationActive) {
            set({
                unreadCounts: {
                    ...unreadCounts,
                    [message.senderId]: (unreadCounts[message.senderId] || 0) + 1,
                },
            });
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
}));
