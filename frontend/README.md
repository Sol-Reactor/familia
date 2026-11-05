# Familia - Frontend

> A modern, animated social networking application built with React and Framer Motion

## 🚀 Features

### Core Functionality
- **Authentication**: Secure login/register with JWT tokens
- **User Profiles**: Customizable profiles with avatars, bios, and cover photos
- **Posts & Feed**: Create, like, comment, and delete posts with image support
- **Real-time Messaging**: WebSocket-powered chat with typing indicators and read receipts
- **Notifications**: Real-time notifications for likes, comments, and friend requests
- **Friends System**: Send, accept, and manage friend requests

### UI/UX Highlights
- ✨ **Purposeful motion**: subtle transitions that fully respect `prefers-reduced-motion`
- 🎨 **Consistent design system**: Plus Jakarta Sans, semantic color tokens, one z-index scale
- 🌙 **Dark mode**: toggle in Settings or the account menu; follows the OS by default and never flashes
- 📱 **Mobile-first**: bottom tab bar on phones, single-pane chat with a back button, no horizontal scroll
- ♿ **Accessible**: labelled icon buttons, visible keyboard focus, 44px touch targets, skip link, ARIA tabs/menus
- ⏳ **Loading & empty states**: skeletons, helpful empty states and retry actions everywhere

### Advanced Features
- **Smart Auto-Scroll**: Intelligent scrolling behavior in chat windows
- **Message Type Filtering**: Separate notification badges for messages vs other notifications
- **Online Status**: Real-time user presence indicators
- **File Uploads**: Cloudinary integration for image hosting
- **Optimistic Updates**: Instant UI feedback with React Query

## 🛠️ Tech Stack

### Core
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing

### State Management
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state management and caching

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Framer Motion** - Animation library

### Real-time Communication
- **Socket.IO Client** - WebSocket connections
- **React Hot Toast** - Toast notifications

### Utilities
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Lucide React** - Icon library

## 📁 Project Structure

```
src/
├── api/                 # API calls and React Query hooks
│   ├── auth.js
│   ├── posts.js
│   ├── messages.js
│   ├── notifications.js
│   └── users.js
├── components/          # Reusable components
│   ├── chat/           # Chat-related components
│   ├── layout/         # Layout components (Navbar, MainLayout)
│   ├── post/           # Post components
│   ├── profile/        # Profile components
│   └── ui/             # Shadcn UI components
├── pages/              # Route pages
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Messages.jsx
│   ├── Notifications.jsx
│   └── Profile.jsx
├── stores/             # Zustand stores
│   ├── authStore.js
│   ├── chatStore.js
│   └── notificationStore.js
├── lib/                # Utilities
│   ├── socket.js       # Socket.IO setup
│   └── axios.js        # Axios configuration
├── utils/              # Helper functions
│   └── animations.js   # Framer Motion variants
└── App.jsx             # Main app component
```

## 🎨 Key Features Explained

### Framer Motion Animations
- **Page Transitions**: Smooth slide-up effects on route changes
- **Stagger Animations**: Sequential appearance of feed items
- **Logo Animations**: Gradient flow and letter-by-letter reveals
- **Hover Effects**: Scale and glow effects on interactive elements

### Real-time Features
- **Instant Messaging**: Messages appear immediately via WebSocket
- **Typing Indicators**: See when someone is typing
- **Online Status**: Green dot indicators for online users
- **Live Notifications**: Bell icon updates in real-time

### Smart UX
- **Unread Badges**: Separate counts for messages and notifications
- **Auto-scroll**: Only scrolls when relevant (at bottom or sender)
- **Optimistic UI**: Instant feedback before server confirmation
- **Loading States**: Skeleton screens and spinners

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend server running (see backend README)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file:

```env
# Backend URL - with or without the trailing /api, both work
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Cloudinary unsigned upload (post images, avatars, covers)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Key Components

### Authentication Flow
- JWT token stored in Zustand
- Automatic Socket.IO connection on login
- Protected routes with authentication checks

### Message System
- Conversation-based messaging
- Unread count tracking per conversation
- Smart notification filtering (messages vs general notifications)

### Notification System
- Type-based filtering (like, comment, friend_request, message)
- Message notifications excluded from bell badge
- Individual delete and clear all functionality

## 🎨 Theming

Colors are defined in `tailwind.config.js`:
- **Primary**: Facebook blue (#1877F2)
- **Gradient**: Blue → Purple → Pink for branding
- **Dark Mode**: Full support with dark: variants

## 📝 Notes

- Scrollbar appears when content overflows (10px width, visible track)
- Message notifications only show in message icon, not notification bell
- Logo animations repeat every 5 seconds in navbar
- All API calls use React Query for caching and automatic refetching

## 🔧 Troubleshooting

**Scrollbar not visible?**
- Ensure enough messages to cause overflow
- Check `.custom-scrollbar` class is applied

**Notifications not working?**
- Verify Socket.IO connection in browser console
- Check backend is emitting events

**Images not uploading?**
- Ensure Cloudinary credentials are set in backend
- Check file size limits

## 📄 License

This project is part of a learning exercise.
