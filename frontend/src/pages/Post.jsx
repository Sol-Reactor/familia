import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, FileQuestion } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/feed/PostCard';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton } from '../components/common/Skeleton';
import { Card } from '../components/ui/card';
import { usePost } from '../api/posts';

/** Single post view - target of notification links and shared URLs */
export default function Post() {
  const { id } = useParams();
  const { data: post, isLoading, isError, error } = usePost(id);
  const status = error?.response?.status;

  return (
    <MainLayout title="Post">
      <Link
        to="/"
        className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to feed
      </Link>

      {isLoading ? (
        <PostSkeleton />
      ) : isError || !post ? (
        <Card>
          <EmptyState
            icon={status === 403 ? Lock : FileQuestion}
            title={status === 403 ? 'This post is only visible to friends' : 'Post not found'}
            description={
              status === 403
                ? 'Add the author as a friend to see their posts.'
                : 'It may have been deleted, or the link is incorrect.'
            }
          />
        </Card>
      ) : (
        <PostCard post={post} defaultShowComments />
      )}
    </MainLayout>
  );
}
