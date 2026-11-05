import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';

// API functions
const fetchConversations = async () => {
    const { data } = await api.get('/messages/conversations');
    return data;
};

const fetchConversation = async (userId) => {
    const { data } = await api.get(`/messages/${userId}`);
    return data;
};

const sendMessage = async (messageData) => {
    const { data } = await api.post('/messages', messageData);
    return data;
};

const markConversationRead = async (userId) => {
    const { data } = await api.put(`/messages/${userId}/read`);
    return data;
};

const deleteMessage = async (messageId) => {
    const { data } = await api.delete(`/messages/${messageId}`);
    return data;
};

// Hooks
export const useConversations = () => {
    return useQuery({
        queryKey: queryKeys.messages.conversations,
        queryFn: fetchConversations,
    });
};

export const useConversation = (userId) => {
    return useQuery({
        queryKey: queryKeys.messages.conversation(userId),
        queryFn: () => fetchConversation(userId),
        enabled: !!userId,
        staleTime: 0,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
            // The chat store already holds the new message; just refresh the sidebar list
            queryClient.invalidateQueries({
                queryKey: queryKeys.messages.conversations
            });
        },
    });
};

export const useMarkConversationRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markConversationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useDeleteMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteMessage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations });
        },
    });
};
