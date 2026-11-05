import prisma from "../prisma.js";
import { sendNotificationToUser } from "../config/socket.js";
import { toInt } from "../utils/query.js";

const senderSelect = {
    select: {
        id: true,
        name: true,
        avatarUrl: true,
    },
};

// Get all notifications for current user
export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = toInt(req.query.limit, 20, { min: 1, max: 100 });
        const skip = toInt(req.query.skip, 0, { min: 0, max: 10000 });
        const unreadOnly = req.query.unreadOnly === "true";

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    userId,
                    ...(unreadOnly && { read: false }),
                },
                include: { sender: senderSelect },
                take: limit,
                skip,
                orderBy: { createdAt: "desc" },
            }),
            prisma.notification.count({
                where: { userId, read: false, NOT: { type: "message" } },
            }),
        ]);

        res.json({ notifications, unreadCount });
    } catch (err) {
        next(err);
    }
};

// Mark notification as read (scoped to the owner - no existence leak for other users' ids)
export const markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const result = await prisma.notification.updateMany({
            where: { id: notificationId, userId: req.user.id },
            data: { read: true },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ id: notificationId, read: true });
    } catch (err) {
        next(err);
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true },
        });

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        next(err);
    }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const result = await prisma.notification.deleteMany({
            where: { id: notificationId, userId: req.user.id },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Clear all notifications
export const clearAllNotifications = async (req, res, next) => {
    try {
        await prisma.notification.deleteMany({ where: { userId: req.user.id } });
        res.json({ message: "All notifications cleared" });
    } catch (err) {
        next(err);
    }
};

/**
 * Create a notification AND push it to the recipient in real time.
 * Safe to call from any controller - failures are logged, never thrown.
 */
export const createNotification = async ({ userId, senderId, postId, type, content }) => {
    try {
        if (!userId || userId === senderId) return null; // never notify yourself

        const notification = await prisma.notification.create({
            data: { userId, senderId, postId, type, content },
            include: { sender: senderSelect },
        });

        sendNotificationToUser(userId, notification);
        return notification;
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
};
