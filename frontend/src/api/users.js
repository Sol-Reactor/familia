import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';

// API functions
const fetchUsers = async (search = '') => {
    const { data } = await api.get(`/users?search=${search}`);
    return data;
};

const fetchUserById = async (userId) => {
    const { data } = await api.get(`/users/${userId}`);
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

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: (data) => {
            // Update the cached profile data
            queryClient.setQueryData(queryKeys.auth.me, data);
            // Also update the user detail cache if it exists
            queryClient.setQueryData(queryKeys.users.detail(data.id), data);
            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        },
    });
};

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: updatePassword,
    });
};

export const useSearchUsers = (query) => {
    return useQuery({
        queryKey: queryKeys.users.search(query),
        queryFn: () => fetchUsers(query),
        enabled: query.length >= 2,
        staleTime: 30000, // 30 seconds
    });
};
