import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Home, Users, Settings, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore } from '../../stores/chatStore';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useSearchUsers } from '../../api/users';
import { useLogout } from '../../api/auth';
import { motion } from 'framer-motion';
import { hoverScale } from '../../utils/animations';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const logout = useLogout();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { data: searchResults } = useSearchUsers(searchQuery);

  const totalUnreadMessages = Object.values(useChatStore((state) => state.unreadCounts))
    .reduce((a, b) => a + b, 0);

  const handleLogout = () => {
    logout.mutate();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.span 
                  className="text-2xl font-bold bg-gradient-to-r from-facebook-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  {['F', 'a', 'm', 'i', 'l', 'i', 'a'].map((letter, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        repeat: Infinity,
                        repeatDelay: 5
                      }}
                      style={{ display: 'inline-block' }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.span>
                
                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-facebook-primary/20 to-purple-600/20 rounded-lg blur-xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search Familia"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.length >= 2 && searchResults && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${result.id}`);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={result.avatarUrl} alt={result.name} />
                        <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{result.name}</p>
                        {result.mutualFriends > 0 && (
                          <p className="text-sm text-gray-500">{result.mutualFriends} mutual friends</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="relative">
                <Home className="h-6 w-6" />
              </Button>
            </Link>

            <Link to="/friends">
              <Button variant="ghost" size="icon" className="relative">
                <Users className="h-6 w-6" />
              </Button>
            </Link>

            <Link to="/messages">
              <Button variant="ghost" size="icon" className="relative">
                <MessageCircle className="h-6 w-6" />
                {totalUnreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {totalUnreadMessages}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-2 ml-2">
              <Link to={`/profile/${user?.id}`}>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Link>

              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
