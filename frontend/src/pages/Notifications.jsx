import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Trash2, X, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import EmptyState from '../components/common/EmptyState';
import { ListItemSkeleton } from '../components/common/Skeleton';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useClearAllNotifications } from '../api/notifications';
import { useNotificationStore } from '../stores/notificationStore';
import { useChatStore } from '../stores/chatStore';
import { cn, getInitials } from '../lib/utils';

const TYPE_META = {
  like: { icon: Heart, className: 'bg-red-500' },
  comment: { icon: MessageCircle, className: 'bg-primary' },
  message: { icon: MessageCircle, className: 'bg-purple-600' },
  friend_request: { icon: UserPlus, className: 'bg-green-600' },
  friend_accept: { icon: UserCheck, className: 'bg-green-600' },
};

const getMeta = (type) => TYPE_META[type?.toLowerCase()] || { icon: Bell, className: 'bg-slate-500' };

const getLink = (notification) => {
  const type = notification.type?.toLowerCase();
  const senderId = notification.sender?.id || notification.senderId;
  if (type === 'message') return '/messages';
  if (type === 'friend_request') return '/friends?tab=requests';
  if (notification.postId) return `/post/${notification.postId}`;
  if (senderId) return `/profile/${senderId}`;
  return '/notifications';
};

export default function Notifications() {
  const { isLoading } = useNotifications();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const hasUnread = notifications.some((n) => !n.read);

  const handleOpen = (notification) => {
    if (!notification.read) markAsRead.mutate(notification.id);
    if (notification.type?.toLowerCase() === 'message' && notification.senderId) {
      setActiveConversation(notification.senderId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) clearAll.mutate();
  };

  return (
    <MainLayout title="Notifications">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Notifications</h1>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {hasUnread && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleClearAll} loading={clearAll.isPending}>
                {!clearAll.isPending && <Trash2 className="h-4 w-4" aria-hidden="true" />}
                Clear all
              </Button>
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <ListItemSkeleton count={4} />
          ) : notifications.length > 0 ? (
            <ul className="divide-y">
              {notifications.map((notification) => {
                const sender = notification.sender || {};
                const { icon: TypeIcon, className: typeClass } = getMeta(notification.type);
                const unread = !notification.read;
                return (
                  <li key={notification.id} className={cn('group relative flex items-center transition-colors', unread ? 'bg-primary/5' : 'hover:bg-accent/60')}>
                    <Link
                      to={getLink(notification)}
                      onClick={() => handleOpen(notification)}
                      className="flex min-w-0 flex-1 items-start gap-3 p-4 pr-2"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={sender.avatarUrl} alt="" />
                          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
                        </Avatar>
                        <span className={cn('absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-card', typeClass)}>
                          <TypeIcon className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm', unread ? 'font-semibold' : 'text-foreground/90')}>
                          {notification.content || `${sender.name || 'Someone'} sent you a notification`}
                        </p>
                        <time dateTime={notification.createdAt} className={cn('mt-0.5 block text-xs', unread ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      {unread && (
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mr-2 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteNotification.mutate(notification.id)}
                      aria-label="Delete notification"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Bell} title="You're all caught up" description="Likes, comments and friend requests will show up here." />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
