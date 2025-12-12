import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) => {
        // Exclude message notifications from bell badge count
        const unreadCount = notifications.filter((n) =>
            !(n.read ?? n.isRead) && n.type !== 'message'
        ).length;
        set({ notifications, unreadCount });
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            // Only increment unreadCount if NOT a message notification
            unreadCount: (notification.read ?? notification.isRead) || notification.type === 'message'
                ? state.unreadCount
                : state.unreadCount + 1,
        }));
    },

    markAsRead: (notificationId) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true, isRead: true })),
            unreadCount: 0,
        }));
    },

    removeNotification: (notificationId) => {
        set((state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            return {
                notifications: state.notifications.filter((n) => n.id !== notificationId),
                unreadCount: notification && !(notification.read ?? notification.isRead)
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount,
            };
        });
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));
