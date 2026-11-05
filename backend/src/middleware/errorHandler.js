import { isProduction } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body is too large" });
    }

    // Prisma known errors
    if (err.code === "P2002") {
        const field = err.meta?.target?.[0];
        return res.status(409).json({
            error: field ? `That ${field} is already in use` : "A record with this data already exists",
            field,
        });
    }
    if (err.code === "P2025") {
        return res.status(404).json({ error: "Record not found" });
    }
    if (err.code === "P2023" || err.code === "P2003") {
        return res.status(400).json({ error: "Invalid request" });
    }

    const status = err.status || err.statusCode || 500;

    if (status >= 500) {
        console.error(err);
        return res.status(status).json({
            // Never leak internal error details (SQL, stack traces) in production
            error: isProduction ? "Internal server error" : err.message || "Internal server error",
        });
    }

    res.status(status).json({ error: err.message || "Request failed" });
};

export const notFound = (req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
    });
};
