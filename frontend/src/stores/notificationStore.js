import { create } from 'zustand';

const isRead = (n) => Boolean(n?.read ?? n?.isRead);
// Message notifications are shown on the Messages icon, not the bell
const countsForBell = (n) => !isRead(n) && n?.type !== 'message';

export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) => {
        set({ notifications, unreadCount: notifications.filter(countsForBell).length });
    },

    addNotification: (notification) => {
        set((state) => {
            if (state.notifications.some((n) => n.id === notification.id)) return state;
            const notifications = [notification, ...state.notifications];
            return { notifications, unreadCount: notifications.filter(countsForBell).length };
        });
    },

    markAsRead: (notificationId) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true, isRead: true } : n
            );
            return { notifications, unreadCount: notifications.filter(countsForBell).length };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true, isRead: true })),
            unreadCount: 0,
        }));
    },

    removeNotification: (notificationId) => {
        set((state) => {
            const notifications = state.notifications.filter((n) => n.id !== notificationId);
            return { notifications, unreadCount: notifications.filter(countsForBell).length };
        });
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));
