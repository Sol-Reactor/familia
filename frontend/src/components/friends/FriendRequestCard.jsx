import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useAcceptRequest, useRejectRequest } from '../../api/friends';

export default function FriendRequestCard({ request }) {
  const acceptRequest = useAcceptRequest();
  const rejectRequest = useRejectRequest();
  // Backend returns the requester under `requester`; keep `sender` as a fallback
  const sender = request?.requester || request?.sender || {};

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleAccept = () => {
    acceptRequest.mutate(request.id);
  };

  const handleReject = () => {
    rejectRequest.mutate(request.id);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Link to={`/profile/${sender.id}`}>
          <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <Avatar className="w-full h-40 rounded-none">
              <AvatarImage src={sender.avatarUrl} alt={sender.name} className="object-cover" />
              <AvatarFallback className="rounded-none text-2xl">
                {getInitials(sender.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </Link>

        <div className="p-4 space-y-3">
          <div className="text-center">
            <Link to={`/profile/${sender.id}`}>
              <h3 className="font-semibold text-lg hover:underline">
                {sender.name}
              </h3>
            </Link>
            {sender?.mutualFriends > 0 && (
              <p className="text-sm text-gray-500">
                {sender.mutualFriends} mutual friends
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="w-full bg-facebook-primary text-white hover:bg-facebook-primary/90"
              onClick={handleAccept}
              disabled={acceptRequest.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={rejectRequest.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
