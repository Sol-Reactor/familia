import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(token) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Socket connected:', this.socket.id);
            console.log('🔌 Ready to receive notifications and messages');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('❌ Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('⚠️ Socket connection error:', error.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    emitToUser(receiverId, event, data) {
        if (this.socket) {
            this.socket.emit(event, { receiverId, ...data });
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export default new SocketService();
