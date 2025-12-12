import { useInfinitePosts } from '../api/posts';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import MainLayout from '../components/layout/MainLayout';

export default function Feed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts || []) || [];

  return (
    <MainLayout>
      <div className="space-y-4">
        <CreatePost />

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading posts...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={ref} className="py-4 text-center">
                {isFetchingNextPage ? (
                  <p className="text-gray-500">Loading more posts...</p>
                ) : (
                  <p className="text-gray-400">Scroll to load more</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Create your first post!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
