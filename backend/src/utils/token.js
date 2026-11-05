import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

const ALGORITHM = "HS256";

/**
 * A short fingerprint of the user's current password hash.
 * Embedding it in the JWT means every token issued before a password
 * change becomes invalid automatically - no extra DB column needed.
 */
export const passwordFingerprint = (passwordHash) =>
    crypto.createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);

export const signToken = (user) =>
    jwt.sign(
        { userId: user.id, pv: passwordFingerprint(user.password) },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN, algorithm: ALGORITHM }
    );

export const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    username: true,
    avatarUrl: true,
    coverUrl: true,
    bio: true,
    location: true,
    website: true,
    createdAt: true,
};

/**
 * Verify a token and load the user it belongs to.
 * Returns the user (without password) or null if the token is invalid,
 * expired, the user no longer exists, or the password has since changed.
 */
export const getUserFromToken = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM] });
    } catch (err) {
        return { user: null, reason: err.name === "TokenExpiredError" ? "Session expired" : "Invalid token" };
    }

    if (!decoded?.userId || !decoded?.pv) {
        return { user: null, reason: "Invalid token" };
    }

    const record = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { ...publicUserSelect, password: true },
    });

    if (!record || passwordFingerprint(record.password) !== decoded.pv) {
        return { user: null, reason: "Session is no longer valid" };
    }

    const { password: _password, ...user } = record;
    return { user, reason: null };
};
