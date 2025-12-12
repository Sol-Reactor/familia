import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';

// API functions
const fetchFriends = async () => {
    const { data } = await api.get('/friends');
    return data;
};

const fetchFriendRequests = async () => {
    const { data } = await api.get('/friends/requests');
    return data;
};

const sendFriendRequest = async (userId) => {
    const { data } = await api.post(`/friends/request/${userId}`);
    return data;
};

const acceptFriendRequest = async (requestId) => {
    const { data } = await api.put(`/friends/accept/${requestId}`);
    return data;
};

const rejectFriendRequest = async (requestId) => {
    const { data } = await api.put(`/friends/reject/${requestId}`);
    return data;
};

const unfriend = async (userId) => {
    const { data } = await api.delete(`/friends/${userId}`);
    return data;
};

const fetchFriendshipStatus = async (userId) => {
    const { data } = await api.get(`/friends/status/${userId}`);
    return data;
};

const fetchSuggestedFriends = async () => {
    const { data } = await api.get('/friends/suggestions');
    return data;
};

// Hooks
export const useFriends = () => {
    return useQuery({
        queryKey: queryKeys.friends.all,
        queryFn: fetchFriends,
    });
};

export const useFriendRequests = () => {
    return useQuery({
        queryKey: queryKeys.friends.requests,
        queryFn: fetchFriendRequests,
    });
};

export const useFriendshipStatus = (userId) => {
    return useQuery({
        queryKey: queryKeys.friends.status(userId),
        queryFn: () => fetchFriendshipStatus(userId),
        enabled: !!userId,
    });
};

export const useSuggestedFriends = () => {
    return useQuery({
        queryKey: queryKeys.friends.suggestions,
        queryFn: fetchSuggestedFriends,
    });
};

export const useSendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sendFriendRequest,
        onSuccess: () => {
            // Only invalidate suggestions to remove the user we just sent a request to
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions });
        },
    });
};

export const useAcceptRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: acceptFriendRequest,
        onMutate: async (requestId) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.friends.requests });

            const previousRequests = queryClient.getQueryData(queryKeys.friends.requests);

            queryClient.setQueryData(queryKeys.friends.requests, (old) => {
                if (!old) return old;
                return old.filter((req) => req.id !== requestId);
            });

            return { previousRequests };
        },
        onError: (err, requestId, context) => {
            queryClient.setQueryData(queryKeys.friends.requests, context.previousRequests);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions });
            queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'posts' });
            queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'friends' && q.queryKey[1] === 'status' });
        },
    });
};

export const useRejectRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: rejectFriendRequest,
        onMutate: async (requestId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.friends.requests });

            const previousRequests = queryClient.getQueryData(queryKeys.friends.requests);

            queryClient.setQueryData(queryKeys.friends.requests, (old) => {
                if (!old) return old;
                return old.filter((req) => req.id !== requestId);
            });

            return { previousRequests };
        },
        onError: (err, requestId, context) => {
            queryClient.setQueryData(queryKeys.friends.requests, context.previousRequests);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests });
        },
    });
};

export const useUnfriend = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unfriend,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
        },
    });
};
