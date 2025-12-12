import prisma from "../prisma.js";
import { createNotification } from "./notification.controller.js";

// Send friend request
export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user.id;

        // Can't send request to yourself
        if (requesterId === userId) {
            return res.status(400).json({ error: "You cannot send a friend request to yourself" });
        }

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userExists) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if friendship already exists
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId: userId },
                    { requesterId: userId, addresseeId: requesterId }
                ]
            }
        });

        if (existingFriendship) {
            if (existingFriendship.status === "accepted") {
                return res.status(400).json({ error: "You are already friends" });
            }
            return res.status(400).json({ error: "Friend request already sent" });
        }

        // Create friend request
        const friendship = await prisma.friendship.create({
            data: {
                requesterId,
                addresseeId: userId,
                status: "pending"
            },
            include: {
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Notify the addressee about the incoming friend request
        await createNotification({
            userId,
            senderId: requesterId,
            type: "FRIEND_REQUEST",
            content: `${req.user.name} sent you a friend request`
        });

        res.status(201).json({ message: "Friend request sent", friendship });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        // Find the friendship
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        // Only addressee can accept
        if (friendship.addresseeId !== userId) {
            return res.status(403).json({ error: "You cannot accept this friend request" });
        }

        // Check if already accepted
        if (friendship.status === "accepted") {
            return res.status(400).json({ error: "Friend request already accepted" });
        }

        // Update to accepted
        const updatedFriendship = await prisma.friendship.update({
            where: { id: requestId },
            data: { status: "accepted" },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Notify requester that their request was accepted
        await createNotification({
            userId: updatedFriendship.requesterId,
            senderId: userId,
            type: "friend_accept",
            content: `${req.user.name} accepted your friend request`
        });

        res.json({ message: "Friend request accepted", friendship: updatedFriendship });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        // Find the friendship
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        // Only addressee can reject
        if (friendship.addresseeId !== userId) {
            return res.status(403).json({ error: "You cannot reject this friend request" });
        }

        // Delete the friendship
        await prisma.friendship.delete({
            where: { id: requestId }
        });

        // Notify requester about rejection
        await createNotification({
            userId: friendship.requesterId,
            senderId: userId,
            type: "friend_reject",
            content: `${req.user.name} rejected your friend request`
        });

        res.json({ message: "Friend request rejected" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Unfriend or cancel request
export const unfriend = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Find friendship in either direction
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: currentUserId, addresseeId: userId },
                    { requesterId: userId, addresseeId: currentUserId }
                ]
            }
        });

        if (!friendship) {
            return res.status(404).json({ error: "Friendship not found" });
        }

        // Delete the friendship
        await prisma.friendship.delete({
            where: { id: friendship.id }
        });

        res.json({ message: "Friendship removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get friends list
export const getFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all accepted friendships
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: "accepted" },
                    { addresseeId: userId, status: "accepted" }
                ]
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        bio: true
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        bio: true
                    }
                }
            }
        });

        // Extract friend user objects
        const friends = friendships.map(f =>
            f.requesterId === userId ? f.addressee : f.requester
        );

        res.json(friends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get pending friend requests
export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find pending requests where user is addressee
        const requests = await prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: "pending"
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                        bio: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get friendship status with a specific user
export const getFriendshipStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        if (currentUserId === userId) {
            return res.json({ status: "self" });
        }

        // Find friendship in either direction
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: currentUserId, addresseeId: userId },
                    { requesterId: userId, addresseeId: currentUserId }
                ]
            }
        });

        if (!friendship) {
            return res.json({ status: null });
        }

        // Return status with direction info
        res.json({
            status: friendship.status,
            requesterId: friendship.requesterId,
            isSent: friendship.requesterId === currentUserId,
            isReceived: friendship.addresseeId === currentUserId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get friend suggestions (non-friends)
export const getSuggestedFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        // Get all user IDs that current user has any friendship with
        const existingFriendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            select: {
                requesterId: true,
                addresseeId: true
            }
        });

        // Extract all user IDs to exclude
        const excludeIds = new Set([userId]);
        existingFriendships.forEach(f => {
            excludeIds.add(f.requesterId);
            excludeIds.add(f.addresseeId);
        });

        // Get users not in the exclude list
        const suggestions = await prisma.user.findMany({
            where: {
                id: {
                    notIn: Array.from(excludeIds)
                }
            },
            take: parseInt(limit),
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                bio: true
            }
        });

        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
