import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, UserMinus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useUnfriend } from '../../api/friends';
import { useChatStore } from '../../stores/chatStore';

export default function FriendCard({ friend }) {
  const unfriend = useUnfriend();
  const navigate = useNavigate();
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleUnfriend = async () => {
    if (window.confirm(`Are you sure you want to unfriend ${friend.name}?`)) {
      unfriend.mutate(friend.id);
    }
  };

  const handleMessage = () => {
    setActiveConversation(friend.id);
    navigate('/messages');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${friend.id}`}>
            <Avatar className="h-16 w-16">
              <AvatarImage src={friend.avatarUrl} alt={friend.name} />
              <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 ">
            <Link to={`/profile/${friend.id}`}>
              <h3 className="font-semibold hover:underline">
                {friend.name}
              </h3>
            </Link>
            {friend.mutualFriends > 0 && (
              <p className="text-sm text-gray-500">{friend.mutualFriends} mutual friends</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleUnfriend}
            disabled={unfriend.isPending}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Unfriend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
