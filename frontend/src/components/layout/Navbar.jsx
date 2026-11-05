import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, MessageCircle, Home, Users, Search, LogOut, Settings, Moon, Sun, User, X, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useId } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { useSearchUsers } from '../../api/users';
import { useLogout } from '../../api/auth';
import Logo from '../common/Logo';
import { cn, getInitials, formatCount } from '../../lib/utils';

function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function CountBadge({ count, label }) {
  const text = formatCount(count);
  if (!text) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white ring-2 ring-card">
      {text}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

function UserSearch({ onNavigate, autoFocus = false }) {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebounced(query);
  const { data: results = [], isFetching } = useSearchUsers(debounced);
  const showResults = open && debounced.trim().length >= 2;

  const go = (user) => {
    navigate(`/profile/${user.id}`);
    setQuery('');
    setOpen(false);
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (!showResults) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search people on Familia"
        placeholder="Search Familia"
        className="h-10 rounded-full border-transparent bg-muted pl-9 focus-visible:bg-card"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />

      {showResults && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-dropdown mt-2 max-h-96 overflow-y-auto rounded-xl border bg-popover p-1 shadow-pop"
        >
          {isFetching && results.length === 0 ? (
            <li className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching…
            </li>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <li
                key={result.id}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors',
                  index === activeIndex ? 'bg-accent' : 'hover:bg-accent'
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(result)}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={result.avatarUrl} alt="" />
                  <AvatarFallback className="text-xs">{getInitials(result.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{result.name}</p>
                  {result.username && <p className="truncate text-xs text-muted-foreground">@{result.username}</p>}
                </div>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-sm text-muted-foreground">No people found for “{debounced}”</li>
          )}
        </ul>
      )}
    </div>
  );
}

function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-opacity hover:opacity-90"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar className="h-9 w-9 ring-2 ring-border">
          <AvatarImage src={user?.avatarUrl} alt="" />
          <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-dropdown mt-2 w-64 rounded-xl border bg-popover p-1.5 shadow-pop animate-in fade-in-0 zoom-in-95">
          <Link to={`/profile/${user?.id}`} role="menuitem" className="mb-1 flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl} alt="" />
              <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">View your profile</p>
            </div>
          </Link>
          <div className="my-1 h-px bg-border" />
          <Link to={`/profile/${user?.id}`} role="menuitem" className={cn(itemClass, 'sm:hidden')}>
            <User className="h-4 w-4" aria-hidden="true" /> Profile
          </Link>
          <Link to="/settings" role="menuitem" className={itemClass}>
            <Settings className="h-4 w-4" aria-hidden="true" /> Settings
          </Link>
          <button type="button" role="menuitem" className={itemClass} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            type="button"
            role="menuitem"
            className={cn(itemClass, 'text-destructive hover:bg-destructive/10')}
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const iconLink = ({ isActive }) =>
    cn(
      'relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    );

  return (
    <header className="sticky top-0 z-nav border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {mobileSearchOpen ? (
          <div className="flex w-full items-center gap-2 sm:hidden">
            <UserSearch autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-accent"
              aria-label="Close search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <Link to="/" className="shrink-0 rounded-md" aria-label="Familia home">
              <Logo size="sm" />
            </Link>

            <div className="mx-auto hidden w-full max-w-md sm:block">
              <UserSearch />
            </div>

            <nav aria-label="Primary" className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Desktop/tablet icon nav - on phones the bottom tab bar takes over */}
              <NavLink to="/" end className={(s) => cn(iconLink(s), 'hidden md:inline-flex lg:hidden')} aria-label="Feed">
                <Home className="h-5 w-5" aria-hidden="true" />
              </NavLink>
              <NavLink to="/friends" className={(s) => cn(iconLink(s), 'hidden md:inline-flex lg:hidden')} aria-label="Friends">
                <Users className="h-5 w-5" aria-hidden="true" />
              </NavLink>
              <NavLink to="/messages" className={(s) => cn(iconLink(s), 'hidden md:inline-flex')} aria-label="Messages">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <CountBadge count={totalUnreadMessages} label="unread messages" />
              </NavLink>
              <NavLink to="/notifications" className={iconLink} aria-label="Notifications">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <CountBadge count={unreadNotifications} label="unread notifications" />
              </NavLink>

              <UserMenu />
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
