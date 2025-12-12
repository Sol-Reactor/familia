import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { useNotificationStore } from './stores/notificationStore';
import { useChatStore } from './stores/chatStore';
import { useNotifications } from './api/notifications';
import { useEffect } from 'react';
import socketService from './lib/socket';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initAuth = useAuthStore((state) => state.initAuth);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addMessage = useChatStore((state) => state.addMessage);
  const addOnlineUser = useChatStore((state) => state.addOnlineUser);
  const removeOnlineUser = useChatStore((state) => state.removeOnlineUser);
  const setOnlineUsers = useChatStore((state) => state.setOnlineUsers);

  useEffect(() => {
    // Initialize auth on app load
    initAuth();
  }, [initAuth]);

  // Fetch notifications globally ONLY when authenticated
  useNotifications({ enabled: isAuthenticated });

  useEffect(() => {
    if (isAuthenticated) {
      // Setup socket event listeners
      socketService.on('notification:new', (notification) => {
        console.log('🔔 Notification received:', notification);
        addNotification(notification);
      });

      socketService.on('message:new', (message) => {
        console.log('💬 Message received:', message);
        addMessage(message, currentUserId);
      });

      socketService.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      socketService.on('user:online', (userId) => {
        addOnlineUser(userId);
      });

      socketService.on('user:offline', (userId) => {
        removeOnlineUser(userId);
      });

      return () => {
        socketService.off('notification:new');
        socketService.off('message:new');
        socketService.off('users:online');
        socketService.off('user:online');
        socketService.off('user:offline');
      };
    }
  }, [isAuthenticated, addNotification, addMessage, addOnlineUser, removeOnlineUser, setOnlineUsers]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to feed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
