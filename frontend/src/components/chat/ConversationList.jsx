import { formatDistanceToNowStrict } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn, formatCount, getInitials } from '../../lib/utils';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

export default function ConversationList({ conversations, activeConversation, onSelectConversation }) {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const currentUserId = useAuthStore((state) => state.user?.id);

  return (
    <ul className="space-y-0.5 p-2" aria-label="Conversations">
      {conversations?.map((conv) => {
        const otherUser = conv.otherUser || {};
        const isOnline = onlineUsers.has(otherUser.id);
        const unreadCount = unreadCounts[otherUser.id] || 0;
        const isActive = activeConversation === otherUser.id;
        const isTyping = typingUsers[otherUser.id];
        const last = conv.lastMessage;
        const prefix = last?.senderId === currentUserId ? 'You: ' : '';

        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onSelectConversation(otherUser.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-200',
                isActive ? 'bg-primary/10' : 'hover:bg-accent'
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={otherUser.avatarUrl} alt="" />
                  <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500">
                    <span className="sr-only">Online</span>
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-[15px]', unreadCount > 0 ? 'font-bold' : 'font-semibold')}>
                    {otherUser.name}
                  </span>
                  {last && (
                    <time dateTime={last.createdAt} className={cn('shrink-0 text-xs', unreadCount > 0 ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                      {formatDistanceToNowStrict(new Date(last.createdAt))}
                    </time>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('truncate text-sm', unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground', isTyping && 'italic text-primary')}>
                    {isTyping ? 'typing…' : last ? `${prefix}${last.content}` : 'Say hi!'}
                  </p>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                      {formatCount(unreadCount)}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
