import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

// API functions
export const loginUser = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const fetchCurrentUser = async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
};

// Hooks - errors are surfaced inline by the forms (no duplicate toasts)
export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();
    const location = useLocation();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            setAuth(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}!`);
            // Return to the page the user originally tried to open
            const from = location.state?.from;
            navigate(typeof from === 'string' && from.startsWith('/') ? from : '/', { replace: true });
        },
    });
};

export const useRegister = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            setAuth(data.user, data.token);
            toast.success(`Welcome to Familia, ${data.user.name}!`);
            navigate('/', { replace: true });
        },
    });
};

export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            // Best effort - the session is cleared locally regardless
            await api.post('/auth/logout').catch(() => {});
        },
        onSettled: () => {
            logout();
            toast.success('Logged out successfully');
            navigate('/login', { replace: true });
        },
    });
};
