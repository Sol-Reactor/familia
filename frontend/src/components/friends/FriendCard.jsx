import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useUnfriend } from '../../api/friends';
import { useChatStore } from '../../stores/chatStore';
import { getErrorMessage, getInitials } from '../../lib/utils';

export default function FriendCard({ friend }) {
  const unfriend = useUnfriend();
  const navigate = useNavigate();
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const isOnline = useChatStore((state) => state.onlineUsers.has(friend.id));

  const handleUnfriend = () => {
    if (window.confirm(`Remove ${friend.name} from your friends?`)) {
      unfriend.mutate(friend.id, {
        onSuccess: () => toast.success(`${friend.name} removed from friends`),
        onError: (err) => toast.error(getErrorMessage(err, 'Failed to unfriend')),
      });
    }
  };

  const handleMessage = () => {
    setActiveConversation(friend.id);
    navigate('/messages');
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${friend.id}`} className="relative shrink-0 rounded-full" aria-label={`${friend.name}'s profile`}>
          <Avatar className="h-14 w-14">
            <AvatarImage src={friend.avatarUrl} alt="" />
            <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500">
              <span className="sr-only">Online</span>
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/profile/${friend.id}`} className="block truncate font-semibold hover:underline">
            {friend.name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {friend.bio || (friend.username ? `@${friend.username}` : isOnline ? 'Active now' : 'Friend')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1" onClick={handleMessage}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Message
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnfriend}
          loading={unfriend.isPending}
          aria-label={`Unfriend ${friend.name}`}
        >
          {!unfriend.isPending && <UserMinus className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Unfriend</span>
        </Button>
      </div>
    </Card>
  );
}
