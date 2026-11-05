import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, PenSquare, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import EmptyState from '../components/common/EmptyState';
import { ListItemSkeleton } from '../components/common/Skeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useConversations } from '../api/messages';
import { useFriends } from '../api/friends';
import { useChatStore } from '../stores/chatStore';
import { cn, getInitials } from '../lib/utils';

function NewMessageDialog({ open, onOpenChange, friends, onSelect }) {
  const [filter, setFilter] = useState('');
  const onlineUsers = useChatStore((s) => s.onlineUsers);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (friends || []).filter((f) => !q || f.name?.toLowerCase().includes(q) || f.username?.toLowerCase().includes(q));
  }, [friends, filter]);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setFilter(''); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>You can message anyone on your friends list.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search friends"
            aria-label="Search friends"
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="custom-scrollbar -mx-2 max-h-80 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((friend) => (
              <li key={friend.id}>
                <button
                  type="button"
                  onClick={() => onSelect(friend.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatarUrl} alt="" />
                      <AvatarFallback className="text-xs">{getInitials(friend.name)}</AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(friend.id) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-popover bg-green-500" />}
                  </div>
                  <span className="truncate font-semibold">{friend.name}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              {friends?.length ? 'No friends match your search.' : (
                <>You don&apos;t have any friends yet. <Link to="/friends?tab=suggestions" className="font-semibold text-primary hover:underline">Find people</Link></>
              )}
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default function Messages() {
  const { data: conversations, isLoading } = useConversations();
  const { data: friends } = useFriends();
  const activeConversation = useChatStore((state) => state.activeConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setUnreadCounts = useChatStore((state) => state.setUnreadCounts);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Sync unread counts when conversations load
  useEffect(() => {
    if (!conversations) return;
    const counts = {};
    conversations.forEach((c) => {
      if (c.unreadCount > 0 && c.otherUser?.id) counts[c.otherUser.id] = c.unreadCount;
    });
    setUnreadCounts(counts);
  }, [conversations, setUnreadCounts]);

  const selectedConversation = conversations?.find((conv) => conv.otherUser?.id === activeConversation);
  const fallbackUser = friends?.find((f) => f.id === activeConversation);
  const chatUser = selectedConversation?.otherUser || fallbackUser;

  const startChat = (friendId) => {
    setActiveConversation(friendId);
    setPickerOpen(false);
  };

  return (
    <MainLayout title="Messages" wide>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="grid h-[calc(100dvh-11rem)] min-h-[420px] grid-cols-1 md:h-[calc(100dvh-8rem)] lg:grid-cols-[340px_1fr]">
          {/* Conversation list - hidden on small screens while a chat is open */}
          <aside className={cn('min-h-0 flex-col border-r', chatUser ? 'hidden lg:flex' : 'flex')}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Chats</h1>
                <p className="text-xs text-muted-foreground">
                  {conversations?.length || 0} conversation{conversations?.length === 1 ? '' : 's'}
                </p>
              </div>
              <Button variant="secondary" size="icon" className="rounded-full" onClick={() => setPickerOpen(true)} aria-label="New message">
                <PenSquare className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <ListItemSkeleton count={5} />
              ) : conversations?.length > 0 ? (
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onSelectConversation={setActiveConversation}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No conversations yet"
                  description="Start a chat with one of your friends."
                  action={<Button onClick={() => setPickerOpen(true)}>New message</Button>}
                />
              )}
            </div>
          </aside>

          {/* Chat */}
          <div className={cn('min-h-0 flex-col', chatUser ? 'flex' : 'hidden lg:flex')}>
            {chatUser ? (
              <ChatWindow
                key={chatUser.id}
                userId={chatUser.id}
                userName={chatUser.name}
                userAvatar={chatUser.avatarUrl}
                onBack={() => setActiveConversation(null)}
              />
            ) : (
              <EmptyState
                className="m-auto"
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a chat from the list or start a new one."
                action={<Button variant="outline" onClick={() => setPickerOpen(true)}>New message</Button>}
              />
            )}
          </div>
        </div>
      </div>

      <NewMessageDialog open={pickerOpen} onOpenChange={setPickerOpen} friends={friends} onSelect={startChat} />
    </MainLayout>
  );
}
