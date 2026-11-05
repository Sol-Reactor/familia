import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

/**
 * Thin wrapper around socket.io-client.
 * Listeners are kept in a registry so they survive reconnects and are attached
 * even if they're registered before the socket is created.
 */
class SocketService {
    constructor() {
        this.socket = null;
        this.token = null;
        this.listeners = new Map(); // event -> Set<callback>
        this.onAuthError = null;
    }

    connect(token) {
        if (!token) return;
        // Already connected/connecting with the same token -> nothing to do
        if (this.socket && this.token === token) return;
        if (this.socket) this.disconnect();

        this.token = token;
        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 10,
        });

        for (const [event, callbacks] of this.listeners) {
            for (const cb of callbacks) this.socket.on(event, cb);
        }

        this.socket.on('connect_error', (error) => {
            if (error?.message === 'Authentication error') {
                // Token rejected by the server - stop retrying and let the app log out
                this.disconnect();
                this.onAuthError?.();
            } else if (import.meta.env.DEV) {
                console.warn('Socket connection error:', error?.message);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }
        this.socket = null;
        this.token = null;
    }

    get connected() {
        return Boolean(this.socket?.connected);
    }

    emit(event, data) {
        this.socket?.emit(event, data);
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(callback);
        this.socket?.on(event, callback);
    }

    off(event, callback) {
        if (!callback) {
            this.listeners.delete(event);
            this.socket?.off(event);
            return;
        }
        this.listeners.get(event)?.delete(callback);
        this.socket?.off(event, callback);
    }
}

export default new SocketService();
