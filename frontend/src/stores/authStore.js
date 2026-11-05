import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import socketService from '../lib/socket';
import { queryClient } from '../lib/queryClient';
import { useChatStore } from './chatStore';
import { useNotificationStore } from './notificationStore';

const LEGACY_KEYS = ['token', 'user'];

/**
 * Single source of truth for the session.
 * Persisted ONCE (key "auth-storage") - the old duplicate localStorage keys
 * caused the app to think it was logged in with no token (redirect loops).
 */
export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            // True once the stored session has been checked against the server
            isSessionVerified: false,
            sessionMessage: null,

            setAuth: (user, token) => {
                socketService.connect(token);
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isSessionVerified: true,
                    sessionMessage: null,
                });
            },

            setToken: (token) => {
                socketService.connect(token);
                set({ token });
            },

            setUser: (user) => {
                set((state) => ({ user: { ...state.user, ...user } }));
            },

            markSessionVerified: () => set({ isSessionVerified: true }),

            clearSessionMessage: () => set({ sessionMessage: null }),

            logout: ({ reason } = {}) => {
                socketService.disconnect();
                queryClient.clear();
                useChatStore.getState().reset();
                useNotificationStore.getState().clearAll();
                LEGACY_KEYS.forEach((key) => {
                    try { localStorage.removeItem(key); } catch { /* ignore */ }
                });

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isSessionVerified: true,
                    sessionMessage: reason === 'expired'
                        ? 'Your session has expired. Please log in again.'
                        : null,
                });
            },

            // Restore a persisted session (and migrate the legacy storage format)
            initAuth: () => {
                let { token, user } = get();

                if (!token) {
                    try {
                        const legacyToken = localStorage.getItem('token');
                        const legacyUser = localStorage.getItem('user');
                        if (legacyToken && legacyUser) {
                            token = legacyToken;
                            user = JSON.parse(legacyUser);
                        }
                    } catch { /* ignore corrupt legacy data */ }
                    LEGACY_KEYS.forEach((key) => {
                        try { localStorage.removeItem(key); } catch { /* ignore */ }
                    });
                }

                if (token && user) {
                    socketService.connect(token);
                    set({ token, user, isAuthenticated: true, isSessionVerified: false });
                } else {
                    set({ token: null, user: null, isAuthenticated: false, isSessionVerified: true });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),
        }
    )
);

// If the socket server rejects our token, end the session
socketService.onAuthError = () => {
    if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout({ reason: 'expired' });
    }
};
