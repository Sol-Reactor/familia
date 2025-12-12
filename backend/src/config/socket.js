import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                process.env.CLIENT_URL,
                process.env.FRONTEND_URL,
                'https://familia-sable.vercel.app'
            ].filter(Boolean),
            credentials: true,
        },
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // Connection event
    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.userId);

        // Join user to their own room
        socket.join(`user:${socket.userId}`);

        // Send the newly connected user the current online user list
        const onlineUsers = Array.from(io.sockets.sockets.values())
            .map((s) => s.userId)
            .filter(Boolean);
        socket.emit('users:online', onlineUsers);

        // Broadcast online status
        socket.broadcast.emit('user:online', socket.userId);

        // ==================== MESSAGING EVENTS ====================

        // Send message
        socket.on('message:send', (data) => {
            // Emit to the receiver
            io.to(`user:${data.receiverId}`).emit('message:new', data);
        });

        // Typing indicators
        socket.on('typing:start', ({ receiverId }) => {
            io.to(`user:${receiverId}`).emit('user:typing', {
                userId: socket.userId,
                isTyping: true,
            });
        });

        socket.on('typing:stop', ({ receiverId }) => {
            io.to(`user:${receiverId}`).emit('user:typing', {
                userId: socket.userId,
                isTyping: false,
            });
        });

        // ==================== NOTIFICATION EVENTS ====================

        // New notification
        socket.on('notification:send', ({ userId, notification }) => {
            io.to(`user:${userId}`).emit('notification:new', notification);
        });

        // ==================== DISCONNECT ====================

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.userId);
            socket.broadcast.emit('user:offline', socket.userId);
        });
    });

    return io;
};

// Helper function to emit events from outside socket context (e.g., in controllers)
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

// Helper to send notification to a user
export const sendNotificationToUser = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification:new', notification);
    }
};

// Helper to send message to a user
export const sendMessageToUser = (userId, message) => {
    if (io) {
        io.to(`user:${userId}`).emit('message:new', message);
    }
};
