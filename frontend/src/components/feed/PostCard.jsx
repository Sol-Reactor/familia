import { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToggleLike, useDeletePost, useUpdatePost } from '../../api/posts';
import { useAuthStore } from '../../stores/authStore';
import { cn, getErrorMessage, getInitials } from '../../lib/utils';
import CommentSection from './CommentSection';

function PostCard({ post, defaultShowComments = false }) {
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');

  const menuRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const isAuthor = user?.id === (post.authorId || post.author?.id);

  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  useEffect(() => {
    if (!showMenu) return;
    const onClick = (event) => menuRef.current && !menuRef.current.contains(event.target) && setShowMenu(false);
    const onKey = (event) => event.key === 'Escape' && setShowMenu(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showMenu]);

  const handleUpdate = () => {
    const text = editContent.trim();
    if (updatePost.isPending) return;
    if (!text) {
      toast.error('Post content cannot be empty');
      return;
    }
    updatePost.mutate(
      { postId: post.id, postData: { content: text } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success('Post updated');
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Failed to update post')),
      }
    );
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm('Delete this post? This cannot be undone.')) {
      deletePost.mutate(post.id, {
        onSuccess: () => toast.success('Post deleted'),
        onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete post')),
      });
    }
  };

  const handleLike = () => {
    if (toggleLike.isPending) return;
    toggleLike.mutate(post.id, {
      onError: (err) => toast.error(getErrorMessage(err, 'Could not update like')),
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.author?.name} on Familia`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Could not share this post');
    }
  };

  const createdAt = new Date(post.createdAt);
  const likesCount = post.likesCount ?? post._count?.likes ?? 0;
  const commentsCount = post.commentsCount ?? post._count?.comments ?? 0;
  const image = post.media?.[0]?.url;

  return (
    <Card as="article" className="overflow-visible">
      <header className="flex items-start justify-between gap-2 p-4 pb-3">
        <Link to={`/profile/${post.author?.id}`} className="group flex min-w-0 items-center gap-3 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatarUrl} alt="" />
            <AvatarFallback className="text-xs">{getInitials(post.author?.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold group-hover:underline">{post.author?.name}</p>
            <time dateTime={createdAt.toISOString()} title={format(createdAt, 'PPpp')} className="text-xs text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </time>
          </div>
        </Link>

        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Post options"
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </Button>

            {showMenu && (
              <div role="menu" className="absolute right-0 top-full z-dropdown mt-1 w-44 rounded-xl border bg-popover p-1 shadow-pop animate-in fade-in-0 zoom-in-95">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setEditContent(post.content || '');
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit post
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="space-y-3 px-4">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor={`edit-${post.id}`} className="sr-only">Edit post</label>
            <Textarea
              id={`edit-${post.id}`}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={5000}
              className="min-h-[100px] text-base"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} loading={updatePost.isPending}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          post.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>
        )}
      </div>

      {image && (
        <div className="mt-3 bg-muted">
          <img
            src={image}
            alt={post.content ? `Photo: ${post.content.slice(0, 80)}` : `Photo shared by ${post.author?.name}`}
            loading="lazy"
            decoding="async"
            className="max-h-[600px] w-full object-contain"
          />
        </div>
      )}

      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {likesCount > 0 && (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                  <Heart className="h-3 w-3 fill-white text-white" aria-hidden="true" />
                </span>
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </>
            )}
          </span>
          {commentsCount > 0 && (
            <button type="button" className="hover:underline" onClick={() => setShowComments(true)}>
              {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      <footer className="mt-3 border-t px-2 py-1">
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            aria-pressed={Boolean(post.isLiked)}
            className={cn('h-10 text-muted-foreground', post.isLiked && 'text-red-500 hover:text-red-600')}
          >
            <Heart className={cn('h-5 w-5 transition-transform duration-200', post.isLiked && 'scale-110 fill-current')} aria-hidden="true" />
            Like
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            className="h-10 text-muted-foreground"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Comment
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare} className="h-10 text-muted-foreground">
            <Share2 className="h-5 w-5" aria-hidden="true" />
            Share
          </Button>
        </div>
      </footer>

      {showComments && (
        <div className="border-t px-4 py-3">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  );
}

export default memo(PostCard);
