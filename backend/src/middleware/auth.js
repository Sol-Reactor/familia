import { getUserFromToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const { user, reason } = await getUserFromToken(token);

        if (!user) {
            return res.status(401).json({ error: reason || "Invalid token" });
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};
