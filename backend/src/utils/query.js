/**
 * Parse a positive integer from a query string value, clamped to [min, max].
 * Prevents NaN / negative / huge values from reaching Prisma.
 */
export const toInt = (value, fallback, { min = 0, max = 100 } = {}) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
};
