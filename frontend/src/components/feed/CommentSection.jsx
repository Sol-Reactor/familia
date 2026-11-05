import { useState, useId } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SendHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../common/Skeleton';
import { useComments, useAddComment } from '../../api/posts';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage, getInitials } from '../../lib/utils';

export default function CommentSection({ postId }) {
  const user = useAuthStore((state) => state.user);
  const [newComment, setNewComment] = useState('');
  const inputId = useId();

  const { data: comments, isLoading, isError, error } = useComments(postId);
  const addComment = useAddComment();

  const submit = async () => {
    const content = newComment.trim();
    if (!content || addComment.isPending) return;
    try {
      await addComment.mutateAsync({ postId, content });
      setNewComment('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add comment'));
    }
  };

  const handleKeyDown = (e) => {
    // Enter to send, Shift+Enter for a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-start gap-2"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl} alt="" />
          <AvatarFallback className="text-[10px]">{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">Write a comment</label>
          <Textarea
            id={inputId}
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            rows={1}
            className="min-h-[40px] resize-none rounded-2xl border-transparent bg-muted pr-12 focus-visible:bg-card"
          />
          <Button
            type="submit"
            size="icon-sm"
            variant="ghost"
            className="absolute bottom-0.5 right-1 rounded-full text-primary"
            disabled={!newComment.trim()}
            loading={addComment.isPending}
            aria-label="Post comment"
          >
            {!addComment.isPending && <SendHorizontal className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-14 flex-1 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(error, 'Could not load comments')}</p>
      ) : comments?.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <Link to={`/profile/${comment.author?.id}`} className="shrink-0 rounded-full" aria-label={comment.author?.name}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author?.avatarUrl} alt="" />
                  <AvatarFallback className="text-[10px]">{getInitials(comment.author?.name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-2xl bg-muted px-3 py-2">
                  <Link to={`/profile/${comment.author?.id}`} className="text-sm font-semibold hover:underline">
                    {comment.author?.name}
                  </Link>
                  <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                </div>
                <time dateTime={comment.createdAt} className="ml-3 mt-1 block text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
