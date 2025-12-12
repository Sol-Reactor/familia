import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, Bell, Settings, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const navigation = [
    {
      name: 'Feed',
      href: '/',
      icon: Home,
    },
    {
      name: 'Profile',
      href: `/profile/${user?.id}`,
      icon: User,
    },
    {
      name: 'Friends',
      href: '/friends',
      icon: Users,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageCircle,
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:block w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-facebook-primary/10 text-facebook-primary font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
