import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../api/notifications';
import { useNotificationStore } from '../stores/notificationStore';

const NotificationIcon = ({ type }) => {
  const normalized = type?.toLowerCase();
  const icons = {
    like: <Heart className="h-5 w-5 text-red-500" />,
    comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
    friend_request: <UserPlus className="h-5 w-5 text-green-500" />,
  };
  return icons[normalized] || <Bell className="h-5 w-5" />;
};

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useNotificationStore((state) => state.clearAll);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const handleClearAll = () => {
    // Delete all notifications from backend
    notifications?.forEach(notification => {
      deleteNotification.mutate(notification.id);
    });
    // Clear from store
    clearAll();
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <div className="flex gap-2">
            {notifications && Array.isArray(notifications) && notifications.some((n) => !n.read) && (
              <Button variant="outline" onClick={() => markAllAsRead.mutate()}>
                Mark all as read
              </Button>
            )}
            {notifications && Array.isArray(notifications) && notifications.length > 0 && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading notifications...</p>
        ) : notifications && Array.isArray(notifications) && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const sender = notification.sender || {};
              // If backend provides a postId, link to the post; otherwise default to profile or stay on page
              const link =
                notification.postId
                  ? `/post/${notification.postId}`
                  : sender.id
                    ? `/profile/${sender.id}`
                    : '#';

              return (
              <Link
                key={notification.id}
                to={link}
                onClick={() => handleNotificationClick(notification)}
              >
                <Card
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={sender.avatarUrl}
                        alt={sender.name}
                      />
                      <AvatarFallback>
                        {getInitials(sender.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {sender.name}
                          </span>{' '}
                          {notification.content}
                        </p>
                        <NotificationIcon type={notification.type} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-facebook-primary rounded-full" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => handleDelete(e, notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No notifications yet</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
