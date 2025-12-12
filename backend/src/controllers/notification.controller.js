import prisma from "../prisma.js";

// Get all notifications for current user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, skip = 0, unreadOnly = false } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly === 'true' && { read: false })
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            take: parseInt(limit),
            skip: parseInt(skip),
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                read: false
            }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        // Find notification
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Check if notification belongs to user
        if (notification.userId !== userId) {
            return res.status(403).json({ error: "This notification doesn't belong to you" });
        }

        // Update to read
        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        res.json(updatedNotification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: {
                userId,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        // Find notification
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Check if notification belongs to user
        if (notification.userId !== userId) {
            return res.status(403).json({ error: "This notification doesn't belong to you" });
        }

        // Delete notification
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ message: "Notification deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.deleteMany({
            where: { userId }
        });

        res.json({ message: "All notifications cleared" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Helper function to create notification (can be called from other controllers)
export const createNotification = async ({
    userId,
    senderId,
    postId,
    type,
    content
}) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                senderId,
                postId,
                type,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });
        return notification;
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
};
