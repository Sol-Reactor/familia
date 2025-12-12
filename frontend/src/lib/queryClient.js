import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // Don't retry on 401 errors (authentication failures)
                if (error?.response?.status === 401) {
                    return false;
                }
                // Retry once for other errors
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
        mutations: {
            retry: 0,
        },
    },
});

// Query keys factory
export const queryKeys = {
    auth: {
        me: ['auth', 'me'],
    },
    posts: {
        all: ['posts'],
        infinite: (params) => ['posts', 'infinite', params],
        detail: (id) => ['posts', id],
        comments: (postId) => ['posts', postId, 'comments'],
    },
    users: {
        all: ['users'],
        detail: (id) => ['users', id],
        search: (query) => ['users', 'search', query],
    },
    friends: {
        all: ['friends'],
        requests: ['friends', 'requests'],
        suggestions: ['friends', 'suggestions'],
        status: (userId) => ['friends', 'status', userId],
    },
    messages: {
        conversations: ['messages', 'conversations'],
        conversation: (userId) => ['messages', 'conversation', userId],
    },
    notifications: {
        all: ['notifications'],
    },
};
