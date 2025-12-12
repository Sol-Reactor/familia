import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { useComments, useAddComment } from '../../api/posts';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';

export default function CommentSection({ postId }) {
  const user = useAuthStore((state) => state.user);
  const [newComment, setNewComment] = useState('');
  
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        postId,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Separator />

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl} alt={user?.name} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || addComment.isPending}
          >
            {addComment.isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Link to={`/profile/${comment.author?.id}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author?.avatarUrl} alt={comment.author?.name} />
                  <AvatarFallback>
                    {getInitials(comment.author?.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <Link to={`/profile/${comment.author?.id}`}>
                    <p className="font-semibold text-sm">
                      {comment.author?.name}
                    </p>
                  </Link>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-3">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
