import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

// API functions
const fetchUsers = async (search = '') => {
    const { data } = await api.get('/users', { params: { search } });
    return data;
};

const fetchUserById = async (userId) => {
    const { data } = await api.get(`/users/${encodeURIComponent(userId)}`);
    return data;
};

const fetchMyProfile = async () => {
    const { data } = await api.get('/users/me/profile');
    return data;
};

const updateProfile = async (profileData) => {
    const { data } = await api.put('/users/me/profile', profileData);
    return data;
};

const updatePassword = async (passwordData) => {
    const { data } = await api.put('/users/me/password', passwordData);
    return data;
};

const deleteAccount = async (password) => {
    const { data } = await api.delete('/users/me/account', { data: { password } });
    return data;
};

// Hooks
export const useUsers = (search = '') => {
    return useQuery({
        queryKey: queryKeys.users.search(search),
        queryFn: () => fetchUsers(search),
        enabled: search.length > 0,
    });
};

export const useUser = (userId) => {
    return useQuery({
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => fetchUserById(userId),
        enabled: !!userId,
        retry: (count, error) => error?.response?.status !== 404 && count < 1,
    });
};

export const useMyProfile = () => {
    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: fetchMyProfile,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: (data) => {
            // Keep the session user (navbar avatar, name, etc.) in sync
            setUser(data);
            queryClient.setQueryData(queryKeys.auth.me, data);
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
};

export const useUpdatePassword = () => {
    const setToken = useAuthStore((state) => state.setToken);

    return useMutation({
        mutationFn: updatePassword,
        onSuccess: (data) => {
            // Old tokens are invalidated server-side; switch to the fresh one
            if (data?.token) setToken(data.token);
        },
    });
};

export const useDeleteAccount = () => {
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => logout(),
    });
};

export const useSearchUsers = (query) => {
    const trimmed = query.trim();
    return useQuery({
        queryKey: queryKeys.users.search(trimmed),
        queryFn: () => fetchUsers(trimmed),
        enabled: trimmed.length >= 2,
        staleTime: 30000,
    });
};
