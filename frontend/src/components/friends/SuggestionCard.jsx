import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useSendRequest } from '../../api/friends';
import toast from 'react-hot-toast';

export default function SuggestionCard({ suggestion }) {
  const sendRequest = useSendRequest();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSendRequest = () => {
    sendRequest.mutate(suggestion.id, {
      onSuccess: () => {
        toast.success(`Friend request sent to ${suggestion.name}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send friend request');
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${suggestion.id}`}>
            <Avatar className="h-16 w-16">
              <AvatarImage src={suggestion.avatarUrl} alt={suggestion.name} />
              <AvatarFallback>{getInitials(suggestion.name)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1">
            <Link to={`/profile/${suggestion.id}`}>
              <h3 className="font-semibold hover:underline">
                {suggestion.name}
              </h3>
            </Link>
            {suggestion.bio && (
              <p className="text-sm text-gray-500 line-clamp-1">{suggestion.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            className="w-full"
            onClick={handleSendRequest}
            disabled={sendRequest.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {sendRequest.isPending ? 'Sending...' : 'Add Friend'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
