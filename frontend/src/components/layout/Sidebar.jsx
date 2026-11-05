import { Link, useLocation } from 'react-router-dom';
import { cn, formatCount, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getNavItems } from './navItems';

export default function Sidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const notificationCount = useNotificationStore((state) => state.unreadCount);
  const messageCount = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const badges = { messages: messageCount, notifications: notificationCount };

  return (
    <aside className="fixed left-0 top-16 hidden h-[calc(100dvh-4rem)] w-64 overflow-y-auto border-r bg-card custom-scrollbar lg:block">
      <nav aria-label="Main" className="space-y-1 p-3">
        <Link
          to={`/profile/${user?.id}`}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} alt="" />
            <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-semibold">{user?.name}</span>
        </Link>

        {getNavItems(user?.id).map((item) => {
          const isActive = item.match(pathname);
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <Link
              key={item.name}
              to={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/80 hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.name}</span>
              {count > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                  {formatCount(count)}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <p className="px-6 pb-6 pt-2 text-xs text-muted-foreground">Familia © {new Date().getFullYear()}</p>
    </aside>
  );
}
