import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useFriendshipStatus, useSendRequest, useUnfriend } from '../api/friends';
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import PostCard from '../components/feed/PostCard';
import { useInfinitePosts } from '../api/posts';
import { useUser } from '../api/users';
import EditProfileModal from '../components/profile/EditProfileModal';

export default function Profile() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.id === id;

  const { data: user, isLoading } = useUser(id);
  const { data: friendshipStatus } = useFriendshipStatus(id);
  const sendRequest = useSendRequest();
  const unfriend = useUnfriend();
  const { data: postsData } = useInfinitePosts();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFriendAction = () => {
    if (friendshipStatus?.status === null) {
      sendRequest.mutate(id);
    } else if (friendshipStatus?.status === 'accepted') {
      if (window.confirm(`Unfriend ${user?.name}?`)) {
        unfriend.mutate(id);
      }
    }
  };

  const userPosts = postsData?.pages.flatMap(page => 
    page.posts.filter(post => post.author.id === id)
  ) || [];

  // Calculate friends count from backend _count fields
  const friendsCount = user?._count 
    ? (user._count.friendships1 || 0) + (user._count.friendships2 || 0)
    : 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Cover Photo & Profile Picture */}
        <Card className="overflow-hidden">
          {/* Cover Photo Section */}
          <div className="relative h-48 sm:h-80 bg-gradient-to-r from-facebook-primary to-blue-600">
            {user?.coverUrl && (
              <img
                src={user.coverUrl}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
          
          {/* Profile Info Section */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20">
              {/* Profile Picture */}
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-lg">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="text-3xl sm:text-4xl">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left sm:mt-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {user?.name}
                </h1>
                {user?.bio && (
                  <p className="text-gray-600 mt-1">{user.bio}</p>
                )}
                <p className="text-gray-500 mt-1">
                  {friendsCount} friends
                </p>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <EditProfileModal user={user} />
                ) : (
                  <>
                    {friendshipStatus?.status === null && (
                      <Button onClick={handleFriendAction}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                    {friendshipStatus?.status === 'pending' && (
                      <Button variant="outline" disabled>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Request Sent
                      </Button>
                    )}
                    {friendshipStatus?.status === 'accepted' && (
                      <Button variant="outline" onClick={handleFriendAction}>
                        <UserX className="h-4 w-4 mr-2" />
                        Unfriend
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Posts</h2>
          {userPosts.length > 0 ? (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No posts yet</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
