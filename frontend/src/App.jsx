import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { queryClient, queryKeys } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { useNotificationStore } from './stores/notificationStore';
import { useChatStore } from './stores/chatStore';
import { useNotifications } from './api/notifications';
import { fetchCurrentUser } from './api/auth';
import socketService from './lib/socket';
import api from './lib/axios';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Post from './pages/Post';

// Components
import ProtectedRoute from './components/ProtectedRoute';

/** Validate a restored session with the server once per load */
function useVerifySession() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionVerified = useAuthStore((s) => s.isSessionVerified);

  useEffect(() => {
    if (!isAuthenticated || isSessionVerified) return;
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().markSessionVerified();
      })
      .catch((error) => {
        // 401s are handled by the axios interceptor (logout). Network errors keep the session.
        if (!cancelled && error?.response?.status !== 401) {
          useAuthStore.getState().markSessionVerified();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isSessionVerified]);
}

/** Real-time events - registered once, independent of which page is open */
function useRealtime() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const typingTimers = new Map();

    const onNotification = (notification) => {
      useNotificationStore.getState().addNotification(notification);
      const type = notification?.type?.toLowerCase();
      if (type === 'friend_request' || type === 'friend_accept') {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'friends' });
      }
    };

    const onMessage = (message) => {
      const currentUserId = useAuthStore.getState().user?.id;
      useChatStore.getState().addMessage(message, currentUserId);
      useChatStore.getState().setTyping(message.senderId, false);
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations });
    };

    const onTyping = ({ userId, isTyping }) => {
      const { setTyping } = useChatStore.getState();
      setTyping(userId, isTyping);
      clearTimeout(typingTimers.get(userId));
      // Safety net in case a "stop" event is lost
      if (isTyping) typingTimers.set(userId, setTimeout(() => setTyping(userId, false), 6000));
    };

    const onOnlineList = (users) => useChatStore.getState().setOnlineUsers(users);
    const onOnline = (userId) => useChatStore.getState().addOnlineUser(userId);
    const onOffline = (userId) => useChatStore.getState().removeOnlineUser(userId);

    socketService.on('notification:new', onNotification);
    socketService.on('message:new', onMessage);
    socketService.on('user:typing', onTyping);
    socketService.on('users:online', onOnlineList);
    socketService.on('user:online', onOnline);
    socketService.on('user:offline', onOffline);

    return () => {
      typingTimers.forEach(clearTimeout);
      socketService.off('notification:new', onNotification);
      socketService.off('message:new', onMessage);
      socketService.off('user:typing', onTyping);
      socketService.off('users:online', onOnlineList);
      socketService.off('user:online', onOnline);
      socketService.off('user:offline', onOffline);
    };
  }, [isAuthenticated]);
}

/** Keep the message badge accurate on every page, not only on /messages */
function useUnreadMessageSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const query = event?.query;
      if (event?.type !== 'updated' || query?.queryKey?.[0] !== 'messages' || query.queryKey[1] !== 'conversations') return;
      const conversations = query.state.data;
      if (!Array.isArray(conversations)) return;
      const counts = {};
      conversations.forEach((c) => {
        if (c.unreadCount > 0 && c.otherUser?.id) counts[c.otherUser.id] = c.unreadCount;
      });
      useChatStore.getState().setUnreadCounts(counts);
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages.conversations,
      queryFn: () => api.get('/messages/conversations').then((r) => r.data),
    });
    return unsubscribe;
  }, [isAuthenticated]);
}

function AppContent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useVerifySession();
  useRealtime();
  useUnreadMessageSync();

  // Fetch notifications globally ONLY when authenticated
  useNotifications({ enabled: isAuthenticated });

  const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

      {/* Protected Routes */}
      <Route path="/" element={protect(<Feed />)} />
      <Route path="/post/:id" element={protect(<Post />)} />
      <Route path="/profile/:id" element={protect(<Profile />)} />
      <Route path="/friends" element={protect(<Friends />)} />
      <Route path="/messages" element={protect(<Messages />)} />
      <Route path="/notifications" element={protect(<Notifications />)} />
      <Route path="/settings" element={protect(<Settings />)} />

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
          position="top-center"
          containerStyle={{ zIndex: 80 }}
          toastOptions={{
            duration: 3000,
            className: '!bg-popover !text-popover-foreground !border !border-border !shadow-pop !rounded-xl !text-sm !font-medium',
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { duration: 4500, iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
