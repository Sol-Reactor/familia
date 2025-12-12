import { useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import { useConversations } from '../api/messages';
import { useChatStore } from '../stores/chatStore';
import { useFriends } from '../api/friends';
import { Button } from '../components/ui/button';

export default function Messages() {
  const { data: conversations, isLoading } = useConversations();
  const { data: friends } = useFriends();
  const activeConversation = useChatStore((state) => state.activeConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setUnreadCounts = useChatStore((state) => state.setUnreadCounts);

  // Sync unread counts when conversations load
  useEffect(() => {
    if (conversations) {
      const counts = {};
      conversations.forEach(c => {
        if (c.unreadCount > 0) {
          counts[c.otherUser.id] = c.unreadCount;
        }
      });
      setUnreadCounts(counts);
    }
  }, [conversations, setUnreadCounts]);

  const selectedConversation = conversations?.find(
    (conv) => conv.otherUser?.id === activeConversation
  );
  const fallbackUser = friends?.find((f) => f.id === activeConversation);

  return (
    <MainLayout>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr]" style={{ height: 'calc(100vh - 9rem)', minHeight: '600px' }}>
          {/* Conversations List */}
          <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-facebook-primary/5 to-transparent flex-shrink-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-facebook-primary to-blue-600 bg-clip-text text-transparent">
                Messages
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {conversations?.length || 0} conversation{conversations?.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Scrollable conversation list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!activeConversation && (
                <div className="p-4 space-y-3">
                  <Button
                    onClick={() => { /* Open friend selector modal */ }}
                    className="w-full bg-facebook-primary hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start New Chat
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-facebook-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-gray-500">Loading conversations...</p>
                </div>
              ) : conversations && conversations.length > 0 ? (
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onSelectConversation={setActiveConversation}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No conversations yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start a chat with your friends</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window - Enhanced */}
          <div className="bg-gray-50 dark:bg-gray-950" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activeConversation && (selectedConversation || fallbackUser) ? (
              <ChatWindow
                userId={activeConversation}
                userName={
                  selectedConversation
                    ? selectedConversation.otherUser.name || selectedConversation.otherUser.firstName || ''
                    : fallbackUser?.name
                }
                userAvatar={
                  selectedConversation
                    ? selectedConversation.otherUser.avatarUrl || selectedConversation.otherUser.profilePicture
                    : fallbackUser?.avatarUrl
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-facebook-primary/20 to-blue-600/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-facebook-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a friend from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
