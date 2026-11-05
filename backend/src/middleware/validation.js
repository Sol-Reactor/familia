/**
 * Request validation middleware.
 * Replaces req.body with the validated (trimmed / normalised) value and
 * strips unknown keys unless the schema explicitly allows them.
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body ?? {}, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            const details = error.details.map((d) => d.message);
            return res.status(400).json({
                error: details[0] || "Validation failed",
                details,
            });
        }

        req.body = value;
        next();
    };
};

/**
 * Validate required fields in request body
 */
export const requireFields = (...fields) => {
    return (req, res, next) => {
        const missing = fields.filter((field) => !req.body[field]);

        if (missing.length > 0) {
            return res.status(400).json({
                error: "Missing required fields",
                fields: missing,
            });
        }

        next();
    };
};
