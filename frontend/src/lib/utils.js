import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/** Two-letter initials for avatar fallbacks */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() || 'U';
}

/**
 * Extract a human-readable message from an API / network error.
 * The backend responds with { error: string, details?: string[] }.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (!error) return fallback;
    const data = error.response?.data;
    if (typeof data?.error === 'string' && data.error) return data.error;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.';
    if (error.response?.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (error.message && !error.response) return error.message;
    return fallback;
}

/** Format a badge count: 1..9 then "9+" */
export function formatCount(count) {
    if (!count || count < 1) return '';
    return count > 9 ? '9+' : String(count);
}

/** Only allow http(s) links to be rendered as anchors (blocks javascript: URLs) */
export function safeExternalUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
        return null;
    }
}
