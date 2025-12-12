import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import FriendCard from '../components/friends/FriendCard';
import FriendRequestCard from '../components/friends/FriendRequestCard';
import SuggestionCard from '../components/friends/SuggestionCard';
import { useFriends, useFriendRequests, useSuggestedFriends } from '../api/friends';

export default function Friends() {
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, suggestions
  
  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();
  const { data: suggestions, isLoading: loadingSuggestions } = useSuggestedFriends();

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends?.length || 0 },
    { id: 'requests', label: 'Friend Requests', count: requests?.length || 0 },
    { id: 'suggestions', label: 'Suggestions', count: suggestions?.length || 0 },
  ];

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Friends</h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-facebook-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-facebook-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'friends' && (
            loadingFriends ? (
              <p className="col-span-full text-center text-gray-500">Loading friends...</p>
            ) : friends && friends.length > 0 ? (
              friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No friends yet. Check out suggestions to add friends!
              </p>
            )
          )}

          {activeTab === 'requests' && (
            loadingRequests ? (
              <p className="col-span-full text-center text-gray-500">Loading requests...</p>
            ) : requests && requests.length > 0 ? (
              requests.map((request) => (
                <FriendRequestCard key={request.id} request={request} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No pending friend requests
              </p>
            )
          )}

          {activeTab === 'suggestions' && (
            loadingSuggestions ? (
              <p className="col-span-full text-center text-gray-500">Loading suggestions...</p>
            ) : suggestions && suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No new people to suggest right now
              </p>
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}
