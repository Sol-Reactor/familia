import app from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled`);
});
