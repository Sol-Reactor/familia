import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useSendRequest } from '../../api/friends';
import { getErrorMessage, getInitials } from '../../lib/utils';

export default function SuggestionCard({ suggestion }) {
  const sendRequest = useSendRequest();
  const [sent, setSent] = useState(false);

  const handleSendRequest = () => {
    sendRequest.mutate(suggestion.id, {
      onSuccess: () => {
        setSent(true);
        toast.success(`Friend request sent to ${suggestion.name}`);
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Failed to send friend request')),
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${suggestion.id}`} className="shrink-0 rounded-full" aria-label={`${suggestion.name}'s profile`}>
          <Avatar className="h-14 w-14">
            <AvatarImage src={suggestion.avatarUrl} alt="" />
            <AvatarFallback>{getInitials(suggestion.name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/profile/${suggestion.id}`} className="block truncate font-semibold hover:underline">
            {suggestion.name}
          </Link>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {suggestion.bio || (suggestion.username ? `@${suggestion.username}` : 'New on Familia')}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant={sent ? 'secondary' : 'default'}
        className="mt-4 w-full"
        onClick={handleSendRequest}
        loading={sendRequest.isPending}
        disabled={sent}
      >
        {sent ? <Check className="h-4 w-4" aria-hidden="true" /> : !sendRequest.isPending && <UserPlus className="h-4 w-4" aria-hidden="true" />}
        {sent ? 'Request sent' : 'Add friend'}
      </Button>
    </Card>
  );
}
