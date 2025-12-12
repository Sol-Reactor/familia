import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { queryKeys } from '../lib/queryClient';

// API functions
const fetchPosts = async ({ pageParam = 1 }) => {
    const { data } = await api.get(`/posts?page=${pageParam}&limit=10`);
    return data;
};

const fetchPostById = async (postId) => {
    const { data } = await api.get(`/posts/${postId}`);
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

// Hooks
export const useInfinitePosts = () => {
    return useInfiniteQuery({
        queryKey: queryKeys.posts.infinite(),
        queryFn: fetchPosts,
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.hasMore) {
                return pages.length + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
};

export const usePost = (postId) => {
    return useQuery({
        queryKey: queryKeys.posts.detail(postId),
        queryFn: () => fetchPostById(postId),
        enabled: !!postId,
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
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });

            const previousData = queryClient.getQueryData(queryKeys.posts.infinite());

            // Update the cache
            queryClient.setQueryData(queryKeys.posts.infinite(), (old) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts?.map((post) =>
                            post.id === postId
                                ? {
                                    ...post,
                                    isLiked: !post.isLiked,
                                    likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
                                }
                                : post
                        ),
                    })),
                };
            });

            return { previousData };
        },
        onError: (err, postId, context) => {
            // Rollback on error
            queryClient.setQueryData(queryKeys.posts.infinite(), context.previousData);
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

export const useComments = (postId) => {
    return useQuery({
        queryKey: queryKeys.posts.comments(postId),
        queryFn: () => fetchComments(postId),
        enabled: !!postId,
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
