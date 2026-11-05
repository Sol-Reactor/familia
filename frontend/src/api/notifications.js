import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

// API functions
const fetchNotifications = async () => {
    const { data } = await api.get('/notifications', { params: { limit: 50 } });
    // Backend returns { notifications: [], unreadCount }
    return data;
};

const markAsRead = async (notificationId) => {
    const { data } = await api.put(`/notifications/read/${notificationId}`);
    return data;
};

const markAllAsRead = async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
};

const deleteNotification = async (notificationId) => {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
};

const clearAll = async () => {
    const { data } = await api.delete('/notifications');
    return data;
};

// Hooks
export const useNotifications = (options = {}) => {
    const setNotifications = useNotificationStore((state) => state.setNotifications);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const query = useQuery({
        queryKey: queryKeys.notifications.all,
        queryFn: fetchNotifications,
        enabled: isAuthenticated && options.enabled !== false,
        retry: false, // Don't retry failed auth requests
        refetchOnWindowFocus: false, // Don't refetch on window focus when not authenticated
    });

    useEffect(() => {
        if (query.data?.notifications) {
            // Normalize read flag
            const normalized = query.data.notifications.map((n) => ({
                ...n,
                read: n.read ?? n.isRead ?? false,
            }));
            setNotifications(normalized);
        }
    }, [query.data, setNotifications]);

    return {
        ...query,
        data: query.data?.notifications || [],
        unreadCount: query.data?.unreadCount || 0,
    };
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    const markLocal = useNotificationStore((state) => state.markAsRead);

    return useMutation({
        mutationFn: markAsRead,
        onMutate: (id) => markLocal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();
    const markAllLocal = useNotificationStore((state) => state.markAllAsRead);

    return useMutation({
        mutationFn: markAllAsRead,
        onMutate: () => markAllLocal(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    const removeLocal = useNotificationStore((state) => state.removeNotification);

    return useMutation({
        mutationFn: deleteNotification,
        onMutate: (id) => removeLocal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useClearAllNotifications = () => {
    const queryClient = useQueryClient();
    const clearLocal = useNotificationStore((state) => state.clearAll);

    return useMutation({
        mutationFn: clearAll,
        onMutate: () => clearLocal(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};
