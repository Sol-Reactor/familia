import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Accept VITE_API_URL with or without the trailing "/api" (the README documents both forms)
const resolveBaseUrl = () => {
    const raw = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const api = axios.create({
    baseURL: resolveBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 20000,
});

// Attach the JWT from the auth store
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Endpoints where a 401 means "wrong credentials", not "session expired"
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

        if (status === 401 && !isAuthEndpoint) {
            const { isAuthenticated, logout } = useAuthStore.getState();
            // Only act once - concurrent 401s must not trigger repeated redirects/reloads
            if (isAuthenticated) {
                logout({ reason: 'expired' });
            }
        }
        return Promise.reject(error);
    }
);

export default api;
