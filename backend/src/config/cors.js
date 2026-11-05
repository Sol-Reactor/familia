import { isProduction } from "./env.js";

// Single source of truth for allowed origins (used by Express AND Socket.IO).
const staticOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://familia-sable.vercel.app",
];

const envOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const allowedOrigins = [...new Set([...staticOrigins, ...envOrigins])];

export const isOriginAllowed = (origin) => {
    // Requests without an Origin header (curl, server-to-server, health checks)
    if (!origin) return true;

    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return true;
    }

    return allowedOrigins.includes(origin);
};

export const corsOriginCallback = (origin, callback) => {
    if (isOriginAllowed(origin)) {
        return callback(null, true);
    }
    const err = new Error("Not allowed by CORS");
    err.status = 403;
    return callback(err);
};
