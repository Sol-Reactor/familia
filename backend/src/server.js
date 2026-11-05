// env.js MUST be imported first so process.env is populated before other modules load.
import "./config/env.js";
import { createServer } from "http";
import app from "./app.js";
import { initializeSocket } from "./config/socket.js";
import prisma from "./prisma.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Socket.IO enabled");
});

const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    httpServer.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
    // Force exit if connections don't close in time
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
