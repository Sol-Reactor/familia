import { Link, useLocation } from 'react-router-dom';
import { cn, formatCount } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { getNavItems } from './navItems';

/** Bottom tab bar for phones (< md). Thumb-reachable, 56px tall + safe area. */
export default function MobileNav() {
  const { pathname } = useLocation();
  const userId = useAuthStore((state) => state.user?.id);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const messageCount = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Notifications live in the top bar; settings in the account menu
  const items = getNavItems(userId).filter((i) => ['Feed', 'Friends', 'Messages', 'Profile'].includes(i.name));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-nav border-t bg-card/95 backdrop-blur pb-safe md:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around">
        {items.map((item) => {
          const isActive = item.match(pathname);
          const count = item.badge === 'messages' ? messageCount : 0;
          return (
            <li key={item.name} className="flex-1">
              <Link
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="relative">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-card">
                      {formatCount(count)}
                    </span>
                  )}
                </span>
                {item.name}
                {count > 0 && <span className="sr-only">, {count} unread</span>}
                {isActive && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
