import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { UserPlus, UserCheck, UserX, MessageCircle, Clock, MapPin, Link as LinkIcon, CalendarDays, Lock, UserRoundX, Check, X } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import EditProfileModal from '../components/profile/EditProfileModal';
import EmptyState from '../components/common/EmptyState';
import { Skeleton, PostSkeleton } from '../components/common/Skeleton';
import { useFriendshipStatus, useSendRequest, useUnfriend, useAcceptRequest, useRejectRequest } from '../api/friends';
import { useInfinitePosts } from '../api/posts';
import { useUser } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { getErrorMessage, getInitials, safeExternalUrl } from '../lib/utils';

function FriendActions({ userId, name, status }) {
  const navigate = useNavigate();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const sendRequest = useSendRequest();
  const unfriend = useUnfriend();
  const acceptRequest = useAcceptRequest();
  const rejectRequest = useRejectRequest();

  const onError = (fallback) => (err) => toast.error(getErrorMessage(err, fallback));

  if (!status) return null;

  if (status.status === 'accepted') {
    return (
      <>
        <Button
          onClick={() => {
            setActiveConversation(userId);
            navigate('/messages');
          }}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message
        </Button>
        <Button
          variant="outline"
          loading={unfriend.isPending}
          onClick={() => {
            if (window.confirm(`Remove ${name} from your friends?`)) {
              unfriend.mutate(userId, { onError: onError('Failed to unfriend') });
            }
          }}
        >
          <UserX className="h-4 w-4" aria-hidden="true" /> Unfriend
        </Button>
      </>
    );
  }

  if (status.status === 'pending' && status.isReceived) {
    return (
      <>
        <Button
          loading={acceptRequest.isPending}
          onClick={() => acceptRequest.mutate(status.id, {
            onSuccess: () => toast.success(`You and ${name} are now friends`),
            onError: onError('Failed to accept request'),
          })}
        >
          <Check className="h-4 w-4" aria-hidden="true" /> Confirm request
        </Button>
        <Button
          variant="outline"
          loading={rejectRequest.isPending}
          onClick={() => rejectRequest.mutate(status.id, { onError: onError('Failed to decline request') })}
        >
          <X className="h-4 w-4" aria-hidden="true" /> Decline
        </Button>
      </>
    );
  }

  if (status.status === 'pending') {
    return (
      <Button
        variant="outline"
        loading={unfriend.isPending}
        onClick={() => unfriend.mutate(userId, {
          onSuccess: () => toast.success('Friend request cancelled'),
          onError: onError('Failed to cancel request'),
        })}
      >
        <Clock className="h-4 w-4" aria-hidden="true" /> Cancel request
      </Button>
    );
  }

  return (
    <Button
      loading={sendRequest.isPending}
      onClick={() => sendRequest.mutate(userId, {
        onSuccess: () => toast.success(`Friend request sent to ${name}`),
        onError: onError('Failed to send friend request'),
      })}
    >
      <UserPlus className="h-4 w-4" aria-hidden="true" /> Add friend
    </Button>
  );
}

export default function Profile() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.id === id;

  const { data: user, isLoading, isError: userError, error: userErrorObj, refetch: refetchUser } = useUser(id);
  const { data: friendshipStatus } = useFriendshipStatus(isOwnProfile ? null : id);
  const isFriend = friendshipStatus?.status === 'accepted';
  const canSeePosts = isOwnProfile || isFriend;

  const {
    data: postsData,
    isLoading: postsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfinitePosts({ userId: id, enabled: Boolean(id) && canSeePosts });

  const { ref, inView } = useInView({ rootMargin: '400px' });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const profile = isOwnProfile ? { ...user, ...currentUser, friendsCount: user?.friendsCount } : user;
  const userPosts = postsData?.pages.flatMap((page) => page.posts || []) || [];
  const website = safeExternalUrl(profile?.website);

  if (isLoading) {
    return (
      <MainLayout title="Profile">
        <Card className="overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none sm:h-64" />
          <div className="flex flex-col items-center gap-3 p-6">
            <Skeleton className="-mt-20 h-32 w-32 rounded-full border-4 border-card" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (userError || !user) {
    return (
      <MainLayout title="Profile">
        <Card>
          {userErrorObj?.response?.status === 404 || !userError ? (
            <EmptyState icon={UserRoundX} title="This profile isn't available" description="The link may be broken, or the account was deleted." />
          ) : (
            <EmptyState
              icon={UserRoundX}
              title="Couldn't load this profile"
              description={getErrorMessage(userErrorObj)}
              action={<Button onClick={() => refetchUser()}>Try again</Button>}
            />
          )}
        </Card>
      </MainLayout>
    );
  }

  const joined = profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : null;

  return (
    <MainLayout title={profile?.name}>
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="relative h-40 brand-gradient sm:h-64">
            {profile?.coverUrl && (
              <img src={profile.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>

          <div className="px-4 pb-6 sm:px-6">
            <div className="-mt-16 flex flex-col items-center gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <Avatar className="h-32 w-32 border-4 border-card shadow-lg sm:h-36 sm:w-36">
                <AvatarImage src={profile?.avatarUrl} alt={`${profile?.name}'s profile picture`} />
                <AvatarFallback className="text-4xl">{getInitials(profile?.name)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 text-center sm:pb-2 sm:text-left">
                <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{profile?.name}</h1>
                {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {profile?.friendsCount ?? 0} {profile?.friendsCount === 1 ? 'friend' : 'friends'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:pb-2">
                {isOwnProfile ? (
                  <EditProfileModal user={profile} />
                ) : (
                  <FriendActions userId={id} name={profile?.name} status={friendshipStatus} />
                )}
              </div>
            </div>

            {(profile?.bio || profile?.location || website || joined) && (
              <div className="mt-6 space-y-2 border-t pt-4">
                {profile?.bio && <p className="whitespace-pre-wrap break-words">{profile.bio}</p>}
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {profile?.location && (
                    <li className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" aria-hidden="true" /> {profile.location}
                    </li>
                  )}
                  {website && (
                    <li className="flex min-w-0 items-center gap-1.5">
                      <LinkIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="truncate font-medium text-primary hover:underline">
                        {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </li>
                  )}
                  {joined && (
                    <li className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" /> Joined {joined}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <section aria-labelledby="posts-heading" className="space-y-4">
          <h2 id="posts-heading" className="px-1 text-lg font-bold">Posts</h2>

          {isOwnProfile && <CreatePost />}

          {!canSeePosts ? (
            <Card>
              <EmptyState
                icon={Lock}
                title={`${profile?.name?.split(' ')[0] || 'Their'}'s posts are for friends`}
                description="Send a friend request to see what they share."
              />
            </Card>
          ) : postsLoading ? (
            <PostSkeleton />
          ) : userPosts.length > 0 ? (
            <>
              {userPosts.map((post) => <PostCard key={post.id} post={post} />)}
              {hasNextPage && <div ref={ref}>{isFetchingNextPage && <PostSkeleton />}</div>}
            </>
          ) : (
            <Card>
              <EmptyState
                icon={UserCheck}
                title="No posts yet"
                description={isOwnProfile ? 'Share something with your friends!' : `${profile?.name} hasn't posted anything yet.`}
              />
            </Card>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
