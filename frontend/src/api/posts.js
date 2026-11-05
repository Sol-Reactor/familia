import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';

// API functions
const fetchPosts = async ({ pageParam = 1, userId }) => {
    const params = new URLSearchParams({ page: String(pageParam), limit: '10' });
    if (userId) params.set('userId', userId);
    const { data } = await api.get(`/posts?${params.toString()}`);
    return data;
};

const fetchPostById = async (postId) => {
    const { data } = await api.get(`/posts/${encodeURIComponent(postId)}`);
    return data;
};

const createPost = async (postData) => {
    const { data } = await api.post('/posts', postData);
    return data;
};

const toggleLike = async (postId) => {
    const { data } = await api.post(`/posts/${postId}/like`);
    return data;
};

const addComment = async ({ postId, content }) => {
    const { data } = await api.post(`/posts/${postId}/comments`, { content });
    return data;
};

const fetchComments = async (postId) => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    return data;
};

const deletePost = async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
};

const updatePost = async ({ postId, postData }) => {
    const { data } = await api.put(`/posts/${postId}`, postData);
    return data;
};

const flipLike = (post) => ({
    ...post,
    isLiked: !post.isLiked,
    likesCount: Math.max(0, (post.likesCount || 0) + (post.isLiked ? -1 : 1)),
});

// Hooks
/** Feed posts, or a single user's posts when `userId` is given (profile page) */
export const useInfinitePosts = ({ userId, enabled = true } = {}) => {
    return useInfiniteQuery({
        queryKey: queryKeys.posts.infinite(userId ? { userId } : { feed: true }),
        queryFn: ({ pageParam }) => fetchPosts({ pageParam, userId }),
        getNextPageParam: (lastPage, pages) => (lastPage?.hasMore ? pages.length + 1 : undefined),
        initialPageParam: 1,
        enabled,
        staleTime: 30 * 1000,
    });
};

export const usePost = (postId) => {
    return useQuery({
        queryKey: queryKeys.posts.detail(postId),
        queryFn: () => fetchPostById(postId),
        enabled: !!postId,
        retry: (count, error) => ![403, 404].includes(error?.response?.status) && count < 1,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
};

export const useToggleLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleLike,
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });

            // Snapshot every cached post list (feed + profiles) and the detail view
            const previousLists = queryClient.getQueriesData({ queryKey: ['posts', 'infinite'] });
            const previousDetail = queryClient.getQueryData(queryKeys.posts.detail(postId));

            queryClient.setQueriesData({ queryKey: ['posts', 'infinite'] }, (old) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts?.map((post) => (post.id === postId ? flipLike(post) : post)),
                    })),
                };
            });

            if (previousDetail) {
                queryClient.setQueryData(queryKeys.posts.detail(postId), flipLike(previousDetail));
            }

            return { previousLists, previousDetail };
        },
        onError: (err, postId, context) => {
            context?.previousLists?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            if (context?.previousDetail) {
                queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousDetail);
            }
        },
    });
};

export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addComment,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.posts.comments(variables.postId)
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
};

export const useComments = (postId, { enabled = true } = {}) => {
    return useQuery({
        queryKey: queryKeys.posts.comments(postId),
        queryFn: () => fetchComments(postId),
        enabled: !!postId && enabled,
        staleTime: 30 * 1000,
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
};

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePost,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(data.id) });
        },
    });
};
