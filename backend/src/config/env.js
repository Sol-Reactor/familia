import dotenv from "dotenv";

// Load environment variables before anything else reads process.env.
// ES module imports are hoisted, so this file must be the FIRST import in server.js.
dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";

const secret = process.env.JWT_SECRET;

if (!secret) {
    if (isProduction) {
        throw new Error("JWT_SECRET is not set. Refusing to start in production without it.");
    }
    console.warn("WARNING: JWT_SECRET is not set. Using an insecure development-only secret.");
    process.env.JWT_SECRET = "dev-only-insecure-secret-change-me";
} else if (secret.length < 32) {
    console.warn("WARNING: JWT_SECRET is shorter than 32 characters. Use a long random value in production.");
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
