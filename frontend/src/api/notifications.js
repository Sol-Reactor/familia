import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';
import { useNotificationStore } from '../stores/notificationStore';

// API functions
const fetchNotifications = async () => {
    const { data } = await api.get('/notifications');
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
export const useNotifications = () => {
    const setNotifications = useNotificationStore((state) => state.setNotifications);

    const query = useQuery({
        queryKey: queryKeys.notifications.all,
        queryFn: fetchNotifications,
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

    return useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useClearAllNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearAll,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};
