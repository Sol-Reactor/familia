import { Server } from "socket.io";
import prisma from "../prisma.js";
import { isOriginAllowed } from "./cors.js";
import { getUserFromToken } from "../utils/token.js";

let io = null;

const userRoom = (userId) => `user:${userId}`;

const areFriends = async (userA, userB) => {
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

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
            credentials: true,
        },
        maxHttpBufferSize: 1e5, // 100 KB - clients only send small typing events
    });

    // Authenticate with the same rules as the REST API (incl. password-change invalidation)
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token || typeof token !== "string") {
                return next(new Error("Authentication error"));
            }
            const { user } = await getUserFromToken(token);
            if (!user) return next(new Error("Authentication error"));
            socket.userId = user.id;
            next();
        } catch {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        const room = userRoom(socket.userId);
        const wasOnline = (io.sockets.adapter.rooms.get(room)?.size || 0) > 0;

        socket.join(room);

        // Send the newly connected user the current online user list
        const onlineUsers = [...new Set(
            Array.from(io.sockets.sockets.values()).map((s) => s.userId).filter(Boolean)
        )];
        socket.emit("users:online", onlineUsers);

        // Only announce once per user, not for every extra tab
        if (!wasOnline) {
            socket.broadcast.emit("user:online", socket.userId);
        }

        // ==================== TYPING INDICATORS ====================
        // NOTE: messages and notifications are ONLY emitted by the server after they are
        // persisted (see controllers). Clients can no longer relay arbitrary
        // "message:send" / "notification:send" payloads to other users (spoofing).

        // Cache friendship checks per socket to avoid a DB hit on every keystroke
        const friendCache = new Map();
        const canTypeTo = async (receiverId) => {
            if (typeof receiverId !== "string" || receiverId === socket.userId) return false;
            if (!friendCache.has(receiverId)) {
                friendCache.set(receiverId, await areFriends(socket.userId, receiverId).catch(() => false));
            }
            return friendCache.get(receiverId);
        };

        const relayTyping = (isTyping) => async (payload) => {
            const receiverId = payload?.receiverId;
            if (!(await canTypeTo(receiverId))) return;
            io.to(userRoom(receiverId)).emit("user:typing", {
                userId: socket.userId,
                isTyping,
            });
        };

        socket.on("typing:start", relayTyping(true));
        socket.on("typing:stop", relayTyping(false));

        // ==================== DISCONNECT ====================
        socket.on("disconnect", () => {
            const stillOnline = (io.sockets.adapter.rooms.get(room)?.size || 0) > 0;
            if (!stillOnline) {
                socket.broadcast.emit("user:offline", socket.userId);
            }
        });
    });

    return io;
};

// Helper function to emit events from outside socket context (e.g., in controllers)
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
};

export const sendNotificationToUser = (userId, notification) => {
    if (io) {
        io.to(userRoom(userId)).emit("notification:new", notification);
    }
};

export const sendMessageToUser = (userId, message) => {
    if (io) {
        io.to(userRoom(userId)).emit("message:new", message);
    }
};
