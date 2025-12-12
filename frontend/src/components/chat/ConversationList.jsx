import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../stores/chatStore';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ conversations, activeConversation, onSelectConversation }) {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-2">
      {conversations?.map((conv) => {
        const otherUser = conv.otherUser;
        const isOnline = onlineUsers.has(otherUser?.id);
        const unreadCount = unreadCounts[otherUser?.id] || 0;
        const isActive = activeConversation === otherUser?.id;

        return (
          <Card
            key={conv.id}
            className={cn(
              'p-3.5 cursor-pointer transition-all duration-200 border-2',
              isActive 
                ? 'bg-gradient-to-r from-facebook-primary/10 to-blue-600/5 border-facebook-primary shadow-md' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:shadow-sm'
            )}
            onClick={() => onSelectConversation(otherUser?.id)}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                <Avatar className={cn(
                  "h-14 w-14 ring-2 transition-all",
                  isActive ? "ring-facebook-primary" : "ring-gray-200 dark:ring-gray-700"
                )}>
                  <AvatarImage src={otherUser?.avatarUrl} alt={otherUser?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-facebook-primary to-blue-600 text-white font-semibold">
                    {getInitials(otherUser?.name)}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white dark:border-gray-900 shadow-sm" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn(
                    'font-semibold truncate text-[15px]', 
                    unreadCount > 0 ? 'text-facebook-primary' : 'text-gray-900 dark:text-gray-100'
                  )}>
                    {otherUser?.name || `${otherUser?.firstName} ${otherUser?.lastName}`}
                  </h3>
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-facebook-primary text-white px-2 py-0.5 text-xs font-bold">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                
                {conv.lastMessage && (
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm truncate flex-1",
                      unreadCount > 0 
                        ? "text-gray-700 dark:text-gray-300 font-medium" 
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {conv.lastMessage.content}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
