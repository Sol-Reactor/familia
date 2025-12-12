/**
 * Request validation middleware
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.details.map(d => d.message),
            });
        }

        next();
    };
};

/**
 * Validate required fields in request body
 */
export const requireFields = (...fields) => {
    return (req, res, next) => {
        const missing = fields.filter(field => !req.body[field]);

        if (missing.length > 0) {
            return res.status(400).json({
                error: "Missing required fields",
                fields: missing,
            });
        }

        next();
    };
};
