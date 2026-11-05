import { Home, Users, MessageCircle, Bell, Settings, User } from 'lucide-react';

export const getNavItems = (userId) => [
  { name: 'Feed', href: '/', icon: Home, match: (path) => path === '/' },
  { name: 'Friends', href: '/friends', icon: Users, match: (path) => path.startsWith('/friends') },
  { name: 'Messages', href: '/messages', icon: MessageCircle, match: (path) => path.startsWith('/messages'), badge: 'messages' },
  { name: 'Notifications', href: '/notifications', icon: Bell, match: (path) => path.startsWith('/notifications'), badge: 'notifications' },
  { name: 'Profile', href: `/profile/${userId}`, icon: User, match: (path) => path === `/profile/${userId}` },
  { name: 'Settings', href: '/settings', icon: Settings, match: (path) => path.startsWith('/settings') },
];
