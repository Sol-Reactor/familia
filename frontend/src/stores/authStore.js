import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import socketService from '../lib/socket';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            setAuth: (user, token) => {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Connect socket with token
                socketService.connect(token);

                set({
                    user,
                    token,
                    isAuthenticated: true,
                });
            },

            setUser: (user) => {
                localStorage.setItem('user', JSON.stringify(user));
                set({ user });
            },

            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Disconnect socket
                socketService.disconnect();

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            initAuth: () => {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');

                if (token && userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        socketService.connect(token);
                        set({
                            user,
                            token,
                            isAuthenticated: true,
                        });
                    } catch (error) {
                        console.error('Failed to parse user data:', error);
                        get().logout();
                    }
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
