
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.code === 'P2002') {
        return res.status(409).json({
            error: "A record with this data already exists",
            field: err.meta?.target?.[0],
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: "Record not found",
        });
    }

    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
};

export const notFound = (req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
    });
};
