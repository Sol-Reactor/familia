# Familia - Backend API

> RESTful API and WebSocket server for the Familia social networking application

## 🚀 Features

### Core API Endpoints
- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Management**: Profile CRUD, search, and settings
- **Posts**: Create, read, update, delete with image uploads
- **Comments**: Nested commenting system
- **Likes**: Like posts and comments
- **Friends**: Friend request system with accept/reject
- **Messages**: Real-time messaging between friends
- **Notifications**: Notification system with type filtering

### Real-time Features
- **Socket.IO Integration**: WebSocket connections for real-time updates
- **Typing Indicators**: Live typing status in chats
- **Online Status**: User presence tracking
- **Instant Notifications**: Real-time notification delivery
- **Message Delivery**: Live message updates

### Security & Validation
- **JWT Authentication**: HS256-pinned tokens; every token embeds a password fingerprint, so changing your password signs out all other sessions
- **Brute-force protection**: rate limits on login (10 / 15 min), sign-up (10 / hour), messages (30 / min) and the whole API (300 / min per IP)
- **No user enumeration**: login returns one generic "Invalid email or password" with constant-time checks
- **Password policy**: 8–72 characters with at least one letter and one number (bcrypt, 12 rounds)
- **Joi Validation**: every request body is validated, trimmed and stripped of unknown fields
- **Safe URLs**: profile websites must be http(s) (blocks `javascript:` XSS); image URLs must be Cloudinary HTTPS
- **Socket.IO hardening**: sockets use the same auth as the REST API; clients can only send typing events (to friends). Messages and notifications are emitted by the server only after they are saved
- **No error leakage**: 500 errors return a generic message in production
- **CORS Protection**: a single shared allow-list for Express and Socket.IO

## 🛠️ Tech Stack

### Core
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM and database migrations
- **PostgreSQL** - Primary database

### Authentication & Security
- **jsonwebtoken** - JWT token generation/verification
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Validation & File Handling
- **Joi** - Schema validation
- **Multer** - File upload middleware
- **Cloudinary** - Image hosting service
- **multer-storage-cloudinary** - Cloudinary storage engine

### Real-time
- **Socket.IO** - WebSocket server

### Development
- **dotenv** - Environment variables
- **morgan** - HTTP request logger
- **nodemon** - Auto-restart on changes

## 📁 Project Structure

```
src/
├── config/
│   └── socket.js           # Socket.IO configuration
├── controllers/
│   ├── auth.controller.js  # Login, register, logout
│   ├── comment.controller.js
│   ├── friendship.controller.js
│   ├── like.controller.js
│   ├── message.controller.js
│   ├── notification.controller.js
│   ├── post.controller.js
│   └── user.controller.js
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── upload.middleware.js # Multer + Cloudinary
│   └── validation.js       # Joi validation
├── routes/
│   ├── auth.routes.js
│   ├── comment.routes.js
│   ├── friendship.routes.js
│   ├── like.routes.js
│   ├── message.routes.js
│   ├── notification.routes.js
│   ├── post.routes.js
│   └── user.routes.js
├── validations/
│   ├── auth.validation.js
│   ├── comment.validation.js
│   ├── post.validation.js
│   └── user.validation.js
├── prisma.js              # Prisma client
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

## 📊 Database Schema

### Models
- **User**: Authentication, profile info
- **Post**: User posts with content and media
- **Comment**: Nested comments on posts
- **Like**: Likes on posts/comments
- **Friendship**: Friend relationships (requester/addressee)
- **Message**: Direct messages between users
- **Notification**: System notifications
- **Media**: Post attachments

### Key Relationships
- User has many Posts, Comments, Likes
- Post has many Comments, Likes, Media
- Friendship connects Users bidirectionally
- Message connects sender and receiver Users

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- PostgreSQL database
- Cloudinary account (for image uploads)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/familia"

# JWT - REQUIRED in production (server refuses to start without it).
# Use a long random value, e.g.: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173   # comma-separate multiple origins

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Development

```bash
# Start dev server (with nodemon)
npm run dev

# Start production server
npm start

# Database commands
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:deploy    # Deploy migrations (production)
```

## 📡 API Endpoints

All routes are prefixed with `/api` and (except register/login) require `Authorization: Bearer <token>`.

### Authentication
```
POST /api/auth/register   # Register new user (rate limited)
POST /api/auth/login      # Login user (rate limited)
GET  /api/auth/me         # Validate token / get current user
POST /api/auth/logout     # Logout (client discards its token)
```

### Users
```
GET    /api/users?search=   # Search users by name/username (max 50)
GET    /api/users/:id          # Get user profile (+ friendsCount)
GET    /api/users/me/profile   # Get own profile
PUT    /api/users/me/profile   # Update profile
PUT    /api/users/me/password  # Update password -> returns a fresh token
DELETE /api/users/me/account   # Delete account (body: { password })
```

### Posts, likes & comments
```
GET    /api/posts?page=&limit=&userId=  # Feed, or one user's posts (friends only)
GET    /api/posts/:id                   # Single post
POST   /api/posts                       # Create post
PUT    /api/posts/:id                   # Update post (author only)
DELETE /api/posts/:id                   # Delete post (author only)
POST   /api/posts/:id/like              # Like / unlike
GET    /api/posts/:id/comments          # List comments
POST   /api/posts/:id/comments          # Add comment
```

### Friends
```
GET    /api/friends                    # Friends list
GET    /api/friends/requests           # Incoming pending requests
GET    /api/friends/suggestions        # People you may know
GET    /api/friends/status/:userId     # Friendship status with a user
POST   /api/friends/request/:userId    # Send friend request
PUT    /api/friends/accept/:requestId  # Accept request
PUT    /api/friends/reject/:requestId  # Decline request
DELETE /api/friends/:userId            # Unfriend / cancel request
```

### Messages
```
GET    /api/messages/conversations   # All conversations
GET    /api/messages/:userId         # Conversation with user (latest 50, marks as read)
PUT    /api/messages/:userId/read    # Mark conversation as read
POST   /api/messages                 # Send message (friends only, rate limited)
DELETE /api/messages/:messageId      # Delete own message
```

### Notifications
```
GET    /api/notifications                       # Notifications + unreadCount
PUT    /api/notifications/read/:notificationId  # Mark as read
PUT    /api/notifications/read-all              # Mark all read
DELETE /api/notifications/:notificationId       # Delete one
DELETE /api/notifications                       # Clear all
```

## 🔌 WebSocket Events

### Client → Server
```javascript
typing:start    // { receiverId } - only relayed to friends
typing:stop     // { receiverId }
```

### Server → Client
```javascript
notification:new  // New notification (likes, comments, friend requests, messages)
message:new       // New message received
user:typing       // Someone is typing
users:online      // Online user list (on connect)
user:online       // User came online
user:offline      // User went offline (last tab closed)
```

## 🔒 Authentication Flow

1. User registers/logs in → receives a JWT (contains user id + password fingerprint)
2. Client stores the token and sends `Authorization: Bearer <token>`
3. `authenticate` middleware verifies the signature, expiry, that the user still exists, and that the password hasn't changed
4. `req.user` is populated with the user (never the password hash)
5. Socket.IO authenticates with the same token and the same checks
6. On app load the client calls `GET /api/auth/me` to validate a stored session

## 📝 Key Features Explained

### Message Notifications
- Messages create notifications in database
- Notifications sent via Socket.IO to receiver only
- Sender never sees notification for own messages
- Frontend filters message notifications from bell badge

### Friend System
- Friendship model tracks requester/addressee
- Status: pending, accepted, blocked
- Must be friends to message
- Friendship required for messaging

### File Uploads
- Multer middleware processes files
- Cloudinary stores images
- URLs saved in database
- Supports avatar, cover photos, and post images

### Validation
- Joi schemas validate all requests
- Flexible validation (allows null, empty strings, partial updates)
- Custom error messages
- `.unknown(true)` allows file upload fields

## 🐛 Common Issues

**Database connection failed?**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`

**JWT errors?**
- Verify `JWT_SECRET` is set
- Check token expiration
- Ensure `Authorization` header format

**Image upload fails?**
- Verify Cloudinary credentials
- Check file size limits (default: 5MB)
- Ensure `multer` middleware is before validation

**Socket.IO not connecting?**
- Check CORS configuration
- Verify client URL in `CLIENT_URL`
- Ensure JWT token is valid

## 🔧 Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_feature

# Deploy to production
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View database
npx prisma studio
```

## 📄 License

This project is part of a learning exercise.
