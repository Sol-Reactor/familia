import prisma from "../prisma.js";
import { sendMessageToUser, sendNotificationToUser } from "../config/socket.js";
import { createNotification } from "./notification.controller.js";

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

// Send message
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        // Can't send message to yourself
        if (senderId === receiverId) {
            return res.status(400).json({ error: "You cannot send a message to yourself" });
        }

        // Check if receiver exists
        const receiverExists = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiverExists) {
            return res.status(404).json({ error: "Receiver not found" });
        }

        // Only allow messaging between friends
        const friends = await areFriends(senderId, receiverId);
        if (!friends) {
            return res.status(403).json({ error: "You can only message your friends" });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Send real-time notification to receiver via Socket.IO
        sendMessageToUser(receiverId, message);

        // Persist notification for receiver
        const notification = await createNotification({
            userId: receiverId,
            senderId,
            type: "message",
            content: `${req.user.name} sent you a message`
        });

        // Send real-time notification to receiver via Socket.IO
        if (notification) {
            sendNotificationToUser(receiverId, notification);
        }

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get conversation with a specific user
export const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const { limit = 50, skip = 0 } = req.query;

        // Only allow messaging between friends
        const friends = await areFriends(currentUserId, userId);
        if (!friends) {
            return res.status(403).json({ error: "You can only message your friends" });
        }

        // Mark messages as read (temporarily disabled - may need migration)
        /* await prisma.message.updateMany({
            where: {
                senderId: userId,
                receiverId: currentUserId,
                isRead: false
            },
            data: { isRead: true }
        }); */

        // Get all messages between the two users
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            },
            take: parseInt(limit),
            skip: parseInt(skip),
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all conversations (unique users with last message)
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all messages where user is sender or receiver
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Group by conversation partner and get last message
        const conversationsMap = new Map();

        messages.forEach(message => {
            const partnerId = message.senderId === userId
                ? message.receiverId
                : message.senderId;

            if (!conversationsMap.has(partnerId)) {
                const otherUser = message.senderId === userId
                    ? message.receiver
                    : message.sender;
                conversationsMap.set(partnerId, {
                    id: partnerId,
                    otherUser,
                    lastMessage: message,
                    unreadCount: 0
                });
            }

            // Calculate unread count
            if (message.receiverId === userId && !message.isRead) {
                const conv = conversationsMap.get(partnerId);
                conv.unreadCount += 1;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Find message
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Only sender can delete their message
        if (message.senderId !== userId) {
            return res.status(403).json({ error: "You can only delete your own messages" });
        }

        // Delete message
        await prisma.message.delete({
            where: { id: messageId }
        });

        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
