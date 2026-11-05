import { useSearchParams } from 'react-router-dom';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import FriendCard from '../components/friends/FriendCard';
import FriendRequestCard from '../components/friends/FriendRequestCard';
import SuggestionCard from '../components/friends/SuggestionCard';
import EmptyState from '../components/common/EmptyState';
import { CardGridSkeleton } from '../components/common/Skeleton';
import { Card } from '../components/ui/card';
import { useFriends, useFriendRequests, useSuggestedFriends } from '../api/friends';
import { cn } from '../lib/utils';

const TAB_IDS = ['friends', 'requests', 'suggestions'];

export default function Friends() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab = TAB_IDS.includes(requested) ? requested : 'friends';
  const setActiveTab = (tab) => setSearchParams(tab === 'friends' ? {} : { tab }, { replace: true });

  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();
  const { data: suggestions, isLoading: loadingSuggestions } = useSuggestedFriends();

  const tabs = [
    { id: 'friends', label: 'All friends', count: friends?.length || 0 },
    { id: 'requests', label: 'Requests', count: requests?.length || 0, highlight: true },
    { id: 'suggestions', label: 'Suggestions', count: 0 },
  ];

  const onTabKeyDown = (e) => {
    const index = TAB_IDS.indexOf(activeTab);
    if (e.key === 'ArrowRight') setActiveTab(TAB_IDS[(index + 1) % TAB_IDS.length]);
    if (e.key === 'ArrowLeft') setActiveTab(TAB_IDS[(index - 1 + TAB_IDS.length) % TAB_IDS.length]);
  };

  const renderGrid = (loading, items, renderItem, empty) => {
    if (loading) return <CardGridSkeleton count={3} />;
    if (!items?.length) {
      return (
        <Card className="col-span-full">
          <EmptyState {...empty} />
        </Card>
      );
    }
    return items.map(renderItem);
  };

  return (
    <MainLayout title="Friends" wide>
      <div className="space-y-4">
        <h1 className="px-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Friends</h1>

        <div
          role="tablist"
          aria-label="Friends sections"
          className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0"
          onKeyDown={onTabKeyDown}
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                  selected ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground/80 shadow-card hover:bg-accent'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold',
                      selected ? 'bg-white/20' : tab.highlight ? 'bg-destructive text-white' : 'bg-muted'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {activeTab === 'friends' &&
            renderGrid(loadingFriends, friends, (friend) => <FriendCard key={friend.id} friend={friend} />, {
              icon: Users,
              title: 'No friends yet',
              description: 'Check out suggestions to start connecting.',
            })}

          {activeTab === 'requests' &&
            renderGrid(loadingRequests, requests, (request) => <FriendRequestCard key={request.id} request={request} />, {
              icon: UserPlus,
              title: 'No pending requests',
              description: 'When someone sends you a friend request, it will show up here.',
            })}

          {activeTab === 'suggestions' &&
            renderGrid(loadingSuggestions, suggestions, (suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />, {
              icon: Sparkles,
              title: 'No suggestions right now',
              description: "You're connected with everyone we know about. Check back later!",
            })}
        </div>
      </div>
    </MainLayout>
  );
}
