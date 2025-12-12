import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

// API functions
export const loginUser = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

// Hooks
export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            setAuth(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate('/');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
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
            toast.success(`Welcome to Facebook, ${data.user.name}!`);
            navigate('/');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        },
    });
};

export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            logout();
        },
        onSuccess: () => {
            queryClient.clear(); // Clear all cache
            toast.success('Logged out successfully');
            navigate('/login');
        },
    });
};
