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
- **JWT Authentication**: Secure token-based auth
- **Joi Validation**: Request validation on all endpoints
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured CORS middleware
- **File Upload Security**: Multer with Cloudinary integration

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

# JWT
JWT_SECRET=your-super-secret-key-here

# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

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

### Authentication
```
POST /api/auth/register   # Register new user
POST /api/auth/login      # Login user
POST /api/auth/logout     # Logout user
GET  /api/auth/me        # Get current user
```

### Users
```
GET    /api/users              # Search users
GET    /api/users/:id          # Get user profile
GET    /api/users/me/profile   # Get own profile
PUT    /api/users/me/profile   # Update profile
PUT    /api/users/me/password  # Update password
DELETE /api/users/me/account   # Delete account
```

### Posts
```
GET    /api/posts           # Get feed posts
GET    /api/posts/my        # Get my posts
GET    /api/posts/:id       # Get single post
POST   /api/posts           # Create post
PUT    /api/posts/:id       # Update post
DELETE /api/posts/:id       # Delete post
```

### Friends
```
GET    /api/friendships           # Get friends list
GET    /api/friendships/requests  # Get pending requests
POST   /api/friendships/request   # Send friend request
PUT    /api/friendships/:id/accept  # Accept request
PUT    /api/friendships/:id/reject  # Reject request
DELETE /api/friendships/:id        # Remove friend
```

### Messages
```
GET  /api/messages/conversations  # Get all conversations
GET  /api/messages/:userId        # Get conversation with user
POST /api/messages                # Send message
```

### Notifications
```
GET    /api/notifications              # Get notifications
PUT    /api/notifications/:id/read     # Mark as read
PUT    /api/notifications/mark-all-read # Mark all read
DELETE /api/notifications/:id          # Delete notification
```

### Likes & Comments
```
POST   /api/likes         # Like post/comment
DELETE /api/likes/:id     # Unlike

POST   /api/comments      # Create comment
DELETE /api/comments/:id  # Delete comment
```

## 🔌 WebSocket Events

### Client → Server
```javascript
typing:start    // User started typing
typing:stop     // User stopped typing
message:send    // Send message
```

### Server → Client
```javascript
notification:new  // New notification
message:new       // New message received
user:typing       // Someone is typing
user:online       // User came online
user:offline      // User went offline
```

## 🔒 Authentication Flow

1. User registers/logs in → receives JWT token
2. Token stored on client, sent in `Authorization: Bearer <token>` header
3. `authenticate` middleware verifies token on protected routes
4. `req.user` populated with user data
5. Socket.IO authenticated via same JWT token

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
