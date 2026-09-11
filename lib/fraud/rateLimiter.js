/**
 * In-memory Rate Limiter for API routes.
 * 
 * Uses a sliding window counter per key (IP or phone).
 * Entries auto-expire after the window period.
 * 
 * Note: In-memory state resets on serverless cold starts. For persistent
 * rate limiting, Firestore-based checks are used as a secondary layer
 * in the order API route (checking recent order timestamps).
 */

const windows = new Map() // key → { count, resetAt }

/**
 * Clean up expired entries periodically to prevent memory leaks.
 */
function cleanup() {
    const now = Date.now()
    for (const [key, entry] of windows) {
        if (now > entry.resetAt) {
            windows.delete(key)
        }
    }
}

// Run cleanup every 5 minutes
let cleanupInterval = null
function ensureCleanup() {
    if (!cleanupInterval && typeof setInterval !== 'undefined') {
        cleanupInterval = setInterval(cleanup, 5 * 60 * 1000)
        // Don't prevent Node.js from exiting
        if (cleanupInterval.unref) cleanupInterval.unref()
    }
}

/**
 * Check and increment the rate limit for a given key.
 * 
 * @param {string} key - Unique identifier (e.g., `ip:1.2.3.4` or `phone:01712345678`)
 * @param {number} maxRequests - Maximum allowed requests in the window
 * @param {number} windowMs - Window duration in milliseconds (default: 1 hour)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(key, maxRequests, windowMs = 60 * 60 * 1000) {
    ensureCleanup()
    const now = Date.now()

    let entry = windows.get(key)

    // If entry expired or doesn't exist, create new window
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs }
        windows.set(key, entry)
    }

    entry.count++

    const allowed = entry.count <= maxRequests
    const remaining = Math.max(0, maxRequests - entry.count)

    return { allowed, remaining, resetAt: entry.resetAt }
}

/**
 * Get current count for a key without incrementing.
 * @param {string} key
 * @returns {number}
 */
export function getRateLimitCount(key) {
    const entry = windows.get(key)
    if (!entry || Date.now() > entry.resetAt) return 0
    return entry.count
}

/**
 * Reset rate limit for a specific key (e.g., admin unblock action).
 * @param {string} key
 */
export function resetRateLimit(key) {
    windows.delete(key)
}
