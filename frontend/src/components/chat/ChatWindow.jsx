import { useEffect, useRef, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { useConversation, useSendMessage } from '../../api/messages';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import socketService from '../../lib/socket';

export default function ChatWindow({ userId, userName, userAvatar }) {
  const currentUser = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousMessagesLength = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  const { data: conversation, isLoading } = useConversation(userId);
  const sendMessage = useSendMessage();

  // store/selectors
  const messages = useChatStore((s) => s.messages[userId]) || conversation || [];
  const typingUsers = useChatStore((s) => s.typingUsers);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setMessages = useChatStore((s) => s.setMessages);

  // Helper: are we near bottom?
  const isAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 120; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Scroll-to-bottom helper (prefer container scroll for consistent behavior)
  const scrollToBottom = useCallback((instant = false) => {
    const el = containerRef.current;
    if (!el) return;
    if (instant) {
      // jump
      el.scrollTop = el.scrollHeight;
    } else {
      // smooth
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll logic: only scroll when new message arrives and user is at bottom or sender is me
  useEffect(() => {
    if (!messages || messages.length === 0) {
      previousMessagesLength.current = messages.length;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isMyMessage = lastMsg?.senderId === currentUser?.id;
    const isNew = messages.length > previousMessagesLength.current;

    if (isNew) {
      // if user was at bottom before or it's my message, scroll
      if (isMyMessage || shouldAutoScrollRef.current) {
        // slightly defer so DOM updates render first
        requestAnimationFrame(() => scrollToBottom(!shouldAutoScrollRef.current && isMyMessage));
      }
    }

    previousMessagesLength.current = messages.length;
  }, [messages, currentUser?.id, scrollToBottom]);

  // Seed store with fetched conversation (persist in chat store)
  useEffect(() => {
    if (conversation && Array.isArray(conversation)) {
      setMessages(userId, conversation);
    }
  }, [conversation, setMessages, userId]);

  // Socket listeners for new messages & typing
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      // only care about messages relevant to this conversation
      if (newMessage.senderId === userId || newMessage.receiverId === userId) {
        addMessage(newMessage, currentUser?.id);
      }
    };

    const handleTyping = ({ userId: typingUserId, isTyping: typingState }) => {
      if (typingUserId === userId) {
        setTyping(typingUserId, typingState);
      }
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('user:typing', handleTyping);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('user:typing', handleTyping);
    };
  }, [userId, addMessage, setTyping, currentUser?.id]);

  // Scroll event handler attached to containerRef
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      shouldAutoScrollRef.current = isAtBottom();
    };

    // passive true for better performance
    el.addEventListener('scroll', onScroll, { passive: true });

    // ensure initial position is at bottom on mount
    requestAnimationFrame(() => scrollToBottom(true));

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [isAtBottom, scrollToBottom]);

  // Typing input handler (no global window timeout)
  const handleTyping = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!isTyping) {
      setIsTyping(true);
      socketService.emit('typing:start', { receiverId: userId });
    }

    // reset local timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emit('typing:stop', { receiverId: userId });
      typingTimeoutRef.current = null;
    }, 2500);
  };

  // Send message handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const payload = { receiverId: userId, content: message.trim() };
      const newMessage = await sendMessage.mutateAsync(payload);

      // emit over socket
      socketService.emit('message:send', newMessage);

      // update local store
      addMessage(newMessage, currentUser?.id);

      // reset input & typing
      setMessage('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socketService.emit('typing:stop', { receiverId: userId });

      // scroll to bottom immediately for sender
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const otherAvatar = userAvatar;
  const otherName = userName;
  const myAvatar = currentUser?.avatarUrl;
  const myName = currentUser?.name;

  return (
    <div 
      className="chat-window-container shadow-xl border-0 bg-white rounded-lg"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent outer scrolling
      }}
    >
      <div className="border-b bg-gradient-to-r from-facebook-primary/5 to-transparent py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-facebook-primary/20">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-facebook-primary text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{userName}</h3>
            {typingUsers[userId] && (
              <div className="flex items-center gap-1 text-sm text-facebook-primary">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-facebook-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-facebook-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-facebook-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-1">Typing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f9fafb',
          minHeight: 0
        }}
      >
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 0, // Important: allows flex child to shrink
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
           className="custom-scrollbar"
        >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-facebook-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (!messages || messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-facebook-primary/10 flex items-center justify-center">
              <Send className="w-10 h-10 text-facebook-primary" />
            </div>
            <p className="text-gray-500 text-lg">Start your conversation</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to get started</p>
          </div>
        ) : (
          messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser?.id;
          const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
          
          // Debug logging
          if (index === 0) {
            console.log('🔍 Message Debug:', {
              currentUserId: currentUser?.id,
              firstMessageSenderId: msg.senderId,
              isOwn,
              messagesTotal: messages.length
            });
          }

          if (isOwn) {
            // My messages - Right side
            return (
              <div
                key={msg.id || `${index}-${msg.createdAt}`}
                className="flex justify-end items-end gap-3 mb-2"
              >
                <div className="flex flex-col items-end max-w-[70%]">
                  <div className="bg-gradient-to-br from-facebook-primary to-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-[11px] mt-1 text-gray-500 text-right">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {showAvatar && (
                  <Avatar className="h-8 w-8 ring-2 ring-facebook-primary/20 shadow-md">
                    <AvatarImage src={myAvatar} alt={myName} />
                    <AvatarFallback className="bg-facebook-primary text-white text-xs">
                      {getInitials(myName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          } else {
            // Other person's messages - Left side
            return (
              <div
                key={msg.id || `${index}-${msg.createdAt}`}
                className="flex justify-start items-end gap-3 mb-2"
              >
                {showAvatar && (
                  <Avatar className="h-8 w-8 ring-2 ring-gray-200 shadow-md">
                    <AvatarImage src={otherAvatar} alt={otherName} />
                    <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">
                      {getInitials(otherName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col items-start max-w-[70%]">
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-[11px] mt-1 text-gray-400 text-left">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          }
        }))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-white dark:bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 w-full items-center">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={handleTyping}
            className="flex-1 h-11 px-4 rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-facebook-primary transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim()}
            className="h-11 w-11 rounded-full bg-facebook-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
