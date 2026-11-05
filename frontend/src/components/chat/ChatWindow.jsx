import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, SendHorizontal, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../common/Skeleton';
import { useConversation, useSendMessage, useMarkConversationRead } from '../../api/messages';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import socketService from '../../lib/socket';
import { cn, getErrorMessage, getInitials } from '../../lib/utils';

const EMPTY = [];

const dayLabel = (date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, d MMMM yyyy');
};

export default function ChatWindow({ userId, userName, userAvatar, onBack }) {
  const currentUser = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const inputId = useId();

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const stickToBottomRef = useRef(true);

  const { data: conversation, isLoading, isError, error } = useConversation(userId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  const storeMessages = useChatStore((s) => s.messages[userId]);
  const messages = storeMessages || conversation || EMPTY;
  const isTyping = useChatStore((s) => s.typingUsers[userId]);
  const isOnline = useChatStore((s) => s.onlineUsers.has(userId));
  const addMessage = useChatStore((s) => s.addMessage);
  const setMessages = useChatStore((s) => s.setMessages);

  // Seed the store with the server copy of the conversation
  useEffect(() => {
    if (Array.isArray(conversation)) setMessages(userId, conversation);
  }, [conversation, setMessages, userId]);

  // Mark as read whenever a new incoming message lands while this chat is open
  const lastIncomingId = [...messages].reverse().find((m) => m.senderId === userId)?.id;
  useEffect(() => {
    if (lastIncomingId) markRead.mutate(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastIncomingId, userId]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Smart auto-scroll: follow new messages only if the user is already at the bottom
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (stickToBottomRef.current || last.senderId === currentUser?.id) {
      requestAnimationFrame(() => scrollToBottom(messages.length > 1));
    }
  }, [messages, currentUser?.id, scrollToBottom]);

  // Jump to bottom when switching conversations; focus the composer
  useEffect(() => {
    stickToBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom(false));
    inputRef.current?.focus({ preventScroll: true });
  }, [userId, scrollToBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.emit('typing:stop', { receiverId: userId });
    }
  }, [userId]);

  // Stop the typing indicator when leaving the conversation
  useEffect(() => stopTyping, [stopTyping]);

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.emit('typing:start', { receiverId: userId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2500);
  };

  const submit = async () => {
    const content = message.trim();
    if (!content || sendMessage.isPending) return;

    setMessage('');
    stopTyping();

    try {
      // The server pushes the message to the receiver; we add our own copy from the response
      const newMessage = await sendMessage.mutateAsync({ receiverId: userId, content });
      addMessage(newMessage, currentUser?.id);
      stickToBottomRef.current = true;
    } catch (err) {
      setMessage(content); // give the text back so nothing is lost
      toast.error(getErrorMessage(err, 'Message not sent'));
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={`Conversation with ${userName}`}>
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2 sm:px-4">
        {onBack && (
          <Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
        <Link to={`/profile/${userId}`} className="flex min-w-0 items-center gap-3 rounded-lg p-1 transition-colors hover:bg-accent">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar} alt="" />
              <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
            </Avatar>
            {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-bold leading-tight">{userName}</h2>
            <p className={cn('text-xs', isTyping ? 'font-medium text-primary' : 'text-muted-foreground')} aria-live="polite">
              {isTyping ? 'typing…' : isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </Link>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden bg-background/60 px-3 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {isLoading && messages.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="m-auto max-w-xs text-center text-sm text-destructive">{getErrorMessage(error, 'Could not load messages')}</div>
        ) : messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <p className="font-semibold">Start your conversation</p>
            <p className="mt-1 text-sm text-muted-foreground">Say hello to {userName?.split(' ')[0]}!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser?.id;
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const date = new Date(msg.createdAt);
            const newDay = !prev || !isSameDay(new Date(prev.createdAt), date);
            const firstInGroup = newDay || prev?.senderId !== msg.senderId;
            const lastInGroup = !next || next.senderId !== msg.senderId || !isSameDay(new Date(next.createdAt), date);

            return (
              <div key={msg.id || `${index}-${msg.createdAt}`}>
                {newDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{dayLabel(date)}</span>
                  </div>
                )}
                <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start', firstInGroup && index > 0 && 'mt-2')}>
                  {!isOwn && (
                    <div className="w-7 shrink-0">
                      {lastInGroup && (
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={userAvatar} alt="" />
                          <AvatarFallback className="text-[10px]">{getInitials(userName)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[65%]',
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-card text-card-foreground',
                      isOwn && lastInGroup && 'rounded-br-md',
                      !isOwn && lastInGroup && 'rounded-bl-md'
                    )}
                    title={format(date, 'PPpp')}
                  >
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.content}</p>
                  </div>
                </div>
                {lastInGroup && (
                  <time
                    dateTime={msg.createdAt}
                    className={cn('mt-1 block text-[11px] text-muted-foreground', isOwn ? 'text-right' : 'pl-9')}
                  >
                    {format(date, 'p')}
                  </time>
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="mt-2 flex items-center gap-2 pl-9" aria-hidden="true">
            <div className="flex gap-1 rounded-2xl border bg-card px-3 py-3">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex shrink-0 items-end gap-2 border-t bg-card p-2 sm:p-3"
      >
        <label htmlFor={inputId} className="sr-only">Message {userName}</label>
        <Textarea
          ref={inputRef}
          id={inputId}
          placeholder="Aa"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border-transparent bg-muted px-4 py-2.5 text-[15px] focus-visible:bg-card"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={!message.trim()}
          loading={sendMessage.isPending}
          aria-label="Send message"
        >
          {!sendMessage.isPending && <SendHorizontal className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </form>
    </section>
  );
}
