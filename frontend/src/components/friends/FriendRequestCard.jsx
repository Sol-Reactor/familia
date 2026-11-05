import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAcceptRequest, useRejectRequest } from '../../api/friends';
import { getErrorMessage, getInitials } from '../../lib/utils';

export default function FriendRequestCard({ request }) {
  const acceptRequest = useAcceptRequest();
  const rejectRequest = useRejectRequest();
  const sender = request?.requester || request?.sender || {};
  const busy = acceptRequest.isPending || rejectRequest.isPending;

  const handleAccept = () => {
    acceptRequest.mutate(request.id, {
      onSuccess: () => toast.success(`You and ${sender.name} are now friends`),
      onError: (err) => toast.error(getErrorMessage(err, 'Failed to accept request')),
    });
  };

  const handleReject = () => {
    rejectRequest.mutate(request.id, {
      onError: (err) => toast.error(getErrorMessage(err, 'Failed to decline request')),
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${sender.id}`} className="shrink-0 rounded-full" aria-label={`${sender.name}'s profile`}>
          <Avatar className="h-14 w-14">
            <AvatarImage src={sender.avatarUrl} alt="" />
            <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${sender.id}`} className="block truncate font-semibold hover:underline">
            {sender.name}
          </Link>
          {request.createdAt && (
            <p className="text-xs text-muted-foreground">
              Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" onClick={handleAccept} loading={acceptRequest.isPending} disabled={busy}>
          Confirm
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReject} loading={rejectRequest.isPending} disabled={busy}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
