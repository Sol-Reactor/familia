import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToggleLike, useDeletePost, useUpdatePost } from '../../api/posts';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import CommentSection from './CommentSection';

export default function PostCard({ post }) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  
  const menuRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const isAuthor = user?.id === post.authorId;

  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = () => {
    if (updatePost.isPending) return;
    updatePost.mutate({ postId: post.id, postData: { content: editContent } }, {
      onSuccess: () => {
        setIsEditing(false);
        setShowMenu(false);
      }
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(post.id);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLike = () => {
    toggleLike.mutate(post.id);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link to={`/profile/${post.author?.id}`} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatarUrl} alt={post.author?.name} />
              <AvatarFallback>
                {getInitials(post.author?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {post.author?.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {isAuthor && (
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors text-left"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Post
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-left"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
             <Textarea 
               value={editContent}
               onChange={(e) => setEditContent(e.target.value)}
               className="min-h-[100px] bg-gray-50 dark:bg-gray-900 border-gray-200 focus:ring-facebook-primary"
             />
             <div className="flex justify-end gap-2">
               <Button 
                 size="sm" 
                 variant="ghost" 
                 onClick={() => {
                   setIsEditing(false);
                   setEditContent(post.content);
                 }}
               >
                 Cancel
               </Button>
               <Button 
                 size="sm" 
                 className="bg-facebook-primary hover:bg-blue-600 text-white"
                 onClick={handleUpdate}
                 disabled={updatePost.isPending}
               >
                 {updatePost.isPending ? 'Saving...' : 'Save Changes'}
               </Button>
             </div>
          </div>
        ) : (
          post.content && (
            <p className="whitespace-pre-wrap">{post.content}</p>
          )
        )}
        
        {post.media && post.media.length > 0 && post.media[0]?.url && (
          <img
            src={post.media[0].url}
            alt="Post content"
            className="rounded-lg w-full object-cover max-h-[600px]"
          />
        )}

        {/* Like and Comment Counts */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>{post.likesCount || 0} likes</span>
          <span>{post.commentsCount || 0} comments</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t pt-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-around w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              'flex-1',
              post.isLiked && 'text-red-500'
            )}
          >
            <Heart className={cn('h-5 w-5 mr-2', post.isLiked && 'fill-current')} />
            Like
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Comment
          </Button>

          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>

        {/* Comment Section */}
        {showComments && <CommentSection postId={post.id} />}
      </CardFooter>
    </Card>
  );
}
