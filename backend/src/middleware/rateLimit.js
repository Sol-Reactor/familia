/**
 * Lightweight in-memory rate limiter (fixed window, per IP + key).
 * Good enough for a single-instance deployment; swap for a Redis-backed
 * limiter if you scale horizontally.
 */
export const rateLimit = ({ windowMs, max, message = "Too many requests. Please try again later." }) => {
    const hits = new Map();

    // Periodically drop expired entries so memory doesn't grow unbounded.
    const sweep = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs);
    sweep.unref?.();

    return (req, res, next) => {
        const now = Date.now();
        const key = `${req.ip}:${req.baseUrl}${req.path}`;
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
        res.setHeader("RateLimit-Reset", String(Math.ceil((entry.resetAt - now) / 1000)));

        if (entry.count > max) {
            res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).json({ error: message });
        }

        next();
    };
};
