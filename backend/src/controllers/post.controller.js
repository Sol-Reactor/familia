import prisma from "../prisma.js";
import { createNotification } from "./notification.controller.js";
import { toInt } from "../utils/query.js";

// Utility: check if two users are friends (accepted friendship)
const areFriends = async (userA, userB) => {
    if (!userA || !userB) return false;
    const friendship = await prisma.friendship.findFirst({
        where: {
            status: "accepted",
            OR: [
                { requesterId: userA, addresseeId: userB },
                { requesterId: userB, addresseeId: userA }
            ]
        }
    });
    return Boolean(friendship);
};

// Create a new post
export const createPost = async (req, res, next) => {
    try {
        const { content, image } = req.body;

        // Get uploaded image URL from either:
        // 1. Multer file upload (backend handles Cloudinary)
        // 2. Pre-uploaded image URL from frontend
        const imageUrl = req.file ? req.file.path : image;

        if (!content && !imageUrl) {
            return res.status(400).json({ error: "Post must have content or an image" });
        }

        const post = await prisma.post.create({
            data: {
                content: content || null,
                authorId: req.user.id,
                media: imageUrl ? {
                    create: [{
                        url: imageUrl,
                        type: 'image'
                    }]
                } : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        res.status(201).json(post);
    } catch (err) {
        next(err);
    }
};

// Get all posts (feed)
export const getPosts = async (req, res, next) => {
    try {
        const limit = toInt(req.query.limit, 20, { min: 1, max: 50 });
        const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
        const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
        const currentUserId = req.user.id;
        const skip = (page - 1) * limit;

        // If userId is provided, get that user's posts (for profile page)
        if (userId) {
            // Only allow if viewing own profile or friends
            const isSelf = userId === currentUserId;
            const canView = isSelf || await areFriends(currentUserId, userId);
            if (!canView) {
                return res.status(403).json({ error: "You can only view posts from friends." });
            }

            const totalPosts = await prisma.post.count({
                where: { authorId: userId }
            });

            const posts = await prisma.post.findMany({
                where: { authorId: userId },
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatarUrl: true
                        }
                    },
                    media: true,
                    likes: {
                        select: {
                            userId: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    }
                }
            });

            // Add isLiked field to each post
            const postsWithLikes = posts.map(post => {
                const isLiked = post.likes.some(like => like.userId === currentUserId);
                const { likes, ...postWithoutLikes } = post;
                return {
                    ...postWithoutLikes,
                    isLiked,
                    likesCount: post._count.likes,
                    commentsCount: post._count.comments
                };
            });

            return res.json({
                posts: postsWithLikes,
                hasMore: skip + posts.length < totalPosts
            });
        }

        // For feed: Get friends' IDs
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: currentUserId, status: "accepted" },
                    { addresseeId: currentUserId, status: "accepted" }
                ]
            }
        });

        // Extract friend IDs
        const friendIds = friendships.map(f =>
            f.requesterId === currentUserId ? f.addresseeId : f.requesterId
        );

        // Include own posts and friends' posts
        const authorIds = [currentUserId, ...friendIds];

        // Get total count for pagination
        const totalPosts = await prisma.post.count({
            where: {
                authorId: { in: authorIds }
            }
        });

        const posts = await prisma.post.findMany({
            where: {
                authorId: { in: authorIds }
            },
            take: limit,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                media: true,
                likes: {
                    select: {
                        userId: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        // Add isLiked field to each post
        const postsWithLikes = posts.map(post => {
            const isLiked = post.likes.some(like => like.userId === currentUserId);
            const { likes, ...postWithoutLikes } = post;
            return {
                ...postWithoutLikes,
                isLiked,
                likesCount: post._count.likes,
                commentsCount: post._count.comments
            };
        });

        res.json({
            posts: postsWithLikes,
            hasMore: skip + posts.length < totalPosts
        });
    } catch (err) {
        next(err);
    }
};

// Get single post by ID
export const getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                media: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true
                            }
                        },
                        _count: {
                            select: { likes: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                likes: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Only author or friends can view a single post
        const isAuthor = post.authorId === req.user.id;
        if (!isAuthor) {
            const canView = await areFriends(req.user.id, post.authorId);
            if (!canView) {
                return res.status(403).json({ error: "You can only view posts from friends." });
            }
        }

        const { likes, comments: _comments, ...rest } = post;
        res.json({
            ...rest,
            isLiked: likes.some((like) => like.userId === req.user.id),
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
        });
    } catch (err) {
        next(err);
    }
};

// Update post
export const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        // Get uploaded image URL from Cloudinary (if any)
        const imageUrl = req.file ? req.file.path : null;

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findUnique({
            where: { id },
            include: { media: true }
        });

        if (!existingPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (existingPost.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this post" });
        }

        // If new image uploaded, delete old media and add new one
        const mediaUpdate = imageUrl ? {
            deleteMany: { postId: id },
            create: [{
                url: imageUrl,
                type: 'image'
            }]
        } : undefined;

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                ...(content !== undefined && { content }),
                ...(mediaUpdate && { media: mediaUpdate })
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        res.json(updatedPost);
    } catch (err) {
        next(err);
    }
};

// Delete post
export const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if post exists and belongs to user
        const existingPost = await prisma.post.findUnique({
            where: { id }
        });

        if (!existingPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (existingPost.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }

        await prisma.post.delete({
            where: { id }
        });

        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Like/Unlike a post
export const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Only author or friends can like the post
        const isAuthor = post.authorId === req.user.id;
        if (!isAuthor) {
            const canInteract = await areFriends(req.user.id, post.authorId);
            if (!canInteract) {
                return res.status(403).json({ error: "You can only like posts from friends." });
            }
        }

        // Check if user already liked the post
        const existingLike = await prisma.like.findFirst({
            where: {
                postId: id,
                userId: req.user.id
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return res.json({ message: "Post unliked", liked: false });
        } else {
            // Like
            await prisma.like.create({
                data: {
                    postId: id,
                    userId: req.user.id
                }
            });

            // Create notification for post author (if not liking own post)
            const currentUserId = req.user.id;
            await createNotification({
                userId: post.authorId,
                senderId: currentUserId,
                postId: id,
                type: 'like',
                content: `${req.user.name} liked your post`
            });

            return res.json({ message: "Post liked", liked: true });
        }
    } catch (err) {
        next(err);
    }
};

// Add comment to post
export const addComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const currentUserId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: "Comment content is required" });
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Only author or friends can comment
        const isAuthor = post.authorId === currentUserId;
        if (!isAuthor) {
            const canInteract = await areFriends(currentUserId, post.authorId);
            if (!canInteract) {
                return res.status(403).json({ error: "You can only comment on posts from friends." });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: currentUserId,
                postId: id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                _count: {
                    select: { likes: true }
                }
            }
        });

        // Create notification for post author (if not commenting on own post)
        await createNotification({
            userId: post.authorId,
            senderId: currentUserId,
            postId: id,
            type: 'comment',
            content: `${req.user.name} commented on your post`
        });

        res.status(201).json(comment);
    } catch (err) {
        next(err);
    }
};

// Get comments for a post
export const getComments = async (req, res, next) => {
    try {
        const { id } = req.params;
        const limit = toInt(req.query.limit, 20, { min: 1, max: 100 });
        const skip = toInt(req.query.skip, 0, { min: 0, max: 100000 });

        // Ensure requester can view post comments (same rule as viewing post)
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const isAuthor = post.authorId === req.user.id;
        if (!isAuthor) {
            const canView = await areFriends(req.user.id, post.authorId);
            if (!canView) {
                return res.status(403).json({ error: "You can only view comments on friends' posts." });
            }
        }

        const comments = await prisma.comment.findMany({
            where: { postId: id },
            take: limit,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                _count: {
                    select: { likes: true }
                }
            }
        });

        res.json(comments);
    } catch (err) {
        next(err);
    }
};
