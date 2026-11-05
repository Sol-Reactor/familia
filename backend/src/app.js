import "./config/env.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import userRouter from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import friendshipRoutes from "./routes/friendship.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { corsOriginCallback } from "./config/cors.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { isProduction } from "./config/env.js";

const app = express();

// Behind Render/Railway/Vercel proxies: needed so req.ip is the real client IP (rate limiting).
app.set("trust proxy", 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // JSON API only - no HTML served
}));

app.use(cors({
    origin: corsOriginCallback,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(morgan(isProduction ? "combined" : "dev"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// General API rate limit (per IP, per route)
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/posts", postRoutes);
app.use("/api/friends", friendshipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
