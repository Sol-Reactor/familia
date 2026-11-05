import prisma from "../prisma.js";
import { sendMessageToUser } from "../config/socket.js";
import { createNotification } from "./notification.controller.js";
import { toInt } from "../utils/query.js";

const participantSelect = {
    select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
    },
};

const areFriends = async (userA, userB) => {
    if (!userA || !userB) return false;
    const friendship = await prisma.friendship.findFirst({
        where: {
            status: "accepted",
            OR: [
                { requesterId: userA, addresseeId: userB },
                { requesterId: userB, addresseeId: userA },
            ],
        },
        select: { id: true },
    });
    return Boolean(friendship);
};

// Send message
export const sendMessage = async (req, res, next) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (senderId === receiverId) {
            return res.status(400).json({ error: "You cannot send a message to yourself" });
        }

        const receiverExists = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true },
        });

        if (!receiverExists) {
            return res.status(404).json({ error: "Receiver not found" });
        }

        if (!(await areFriends(senderId, receiverId))) {
            return res.status(403).json({ error: "You can only message your friends" });
        }

        const message = await prisma.message.create({
            data: { senderId, receiverId, content },
            include: { sender: participantSelect, receiver: participantSelect },
        });

        // Real-time delivery (server is the only source of message:new events)
        sendMessageToUser(receiverId, message);

        // Persist + push notification (createNotification emits via socket)
        await createNotification({
            userId: receiverId,
            senderId,
            type: "message",
            content: `${req.user.name} sent you a message`,
        });

        res.status(201).json(message);
    } catch (err) {
        next(err);
    }
};

// Get conversation with a specific user (most recent messages, oldest first)
export const getConversation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const limit = toInt(req.query.limit, 50, { min: 1, max: 200 });
        const skip = toInt(req.query.skip, 0, { min: 0, max: 100000 });

        if (!(await areFriends(currentUserId, userId))) {
            return res.status(403).json({ error: "You can only message your friends" });
        }

        // Mark incoming messages as read now that the conversation is opened
        await prisma.message.updateMany({
            where: { senderId: userId, receiverId: currentUserId, isRead: false },
            data: { isRead: true },
        });

        // Fetch NEWEST first so "limit" keeps the latest messages, then flip for display
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId },
                ],
            },
            take: limit,
            skip,
            orderBy: { createdAt: "desc" },
            include: { sender: participantSelect, receiver: participantSelect },
        });

        res.json(messages.reverse());
    } catch (err) {
        next(err);
    }
};

// Get all conversations (unique users with last message)
export const getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: { createdAt: "desc" },
            take: 2000,
            include: { sender: participantSelect, receiver: participantSelect },
        });

        const conversationsMap = new Map();

        for (const message of messages) {
            const isMine = message.senderId === userId;
            const partnerId = isMine ? message.receiverId : message.senderId;

            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    id: partnerId,
                    otherUser: isMine ? message.receiver : message.sender,
                    lastMessage: message,
                    unreadCount: 0,
                });
            }

            if (!isMine && !message.isRead) {
                conversationsMap.get(partnerId).unreadCount += 1;
            }
        }

        res.json(Array.from(conversationsMap.values()));
    } catch (err) {
        next(err);
    }
};

// Mark a conversation as read without refetching it
export const markConversationRead = async (req, res, next) => {
    try {
        const { userId } = req.params;
        await prisma.message.updateMany({
            where: { senderId: userId, receiverId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        // Clear the matching "message" notifications too
        await prisma.notification.updateMany({
            where: { userId: req.user.id, senderId: userId, type: "message", read: false },
            data: { read: true },
        });
        res.json({ message: "Conversation marked as read" });
    } catch (err) {
        next(err);
    }
};

// Delete message
export const deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({ where: { id: messageId } });

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (message.senderId !== req.user.id) {
            return res.status(403).json({ error: "You can only delete your own messages" });
        }

        await prisma.message.delete({ where: { id: messageId } });

        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        next(err);
    }
};
