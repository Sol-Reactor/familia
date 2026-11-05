import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Newspaper, Users, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInfinitePosts } from '../api/posts';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import MainLayout from '../components/layout/MainLayout';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton, LoadingStatus } from '../components/common/Skeleton';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getErrorMessage } from '../lib/utils';

export default function Feed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfinitePosts();

  const { ref, inView } = useInView({ rootMargin: '400px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts || []) || [];

  return (
    <MainLayout title="Feed">
      <h1 className="sr-only">News feed</h1>
      <div className="space-y-4">
        <CreatePost />

        {isLoading ? (
          <>
            <LoadingStatus label="Loading posts" />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : isError ? (
          <Card>
            <EmptyState
              icon={RefreshCw}
              title="Couldn't load your feed"
              description={getErrorMessage(error)}
              action={<Button onClick={() => refetch()}>Try again</Button>}
            />
          </Card>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasNextPage ? (
              <div ref={ref} className="py-2">
                {isFetchingNextPage && <PostSkeleton />}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up</p>
            )}
          </>
        ) : (
          <Card>
            <EmptyState
              icon={Newspaper}
              title="Your feed is quiet"
              description="Share your first post above, or add friends to see what they're up to."
              action={
                <Link
                  to="/friends?tab=suggestions"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Find friends
                </Link>
              }
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
