import crypto from 'crypto'

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours
const COOKIE_NAME = 'gocart_admin_session'

/**
 * Get server secret for signing session tokens
 */
function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'gocart_super_secret_session_key_2026_fallback'
    return secret
}

/**
 * Get admin credentials configured on the server
 */
export function getAdminCredentials() {
    const email = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'idrisrashel@gmail.com').toLowerCase().trim()
    const password = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '@idris@1I@idris@1I@idris@1I'
    return { email, password }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Generate a cryptographically secure admin session token
 * Token format: Base64(payload).HMAC(payload, secret)
 */
export function createAdminSessionToken(email, ip = 'unknown', userAgent = 'unknown') {
    const secret = getSessionSecret()
    const now = Date.now()
    const expiresAt = now + SESSION_DURATION_MS
    const nonce = crypto.randomBytes(16).toString('hex')

    // Create compact client fingerprint
    const fpHash = crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 16)

    const payload = JSON.stringify({
        email: email.toLowerCase().trim(),
        issuedAt: now,
        expiresAt,
        nonce,
        fp: fpHash,
    })

    const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url')
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')

    return `${encodedPayload}.${signature}`
}

/**
 * Verify an admin session token
 * Returns { valid: boolean, payload?: object, error?: string }
 */
export function verifyAdminSessionToken(token, ip = null, userAgent = null) {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token missing' }
    }

    const parts = token.split('.')
    if (parts.length !== 2) {
        return { valid: false, error: 'Malformed token' }
    }

    const [encodedPayload, providedSignature] = parts
    const secret = getSessionSecret()

    // 1. Verify signature with constant-time comparison
    const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
    if (!constantTimeCompare(providedSignature, expectedSignature)) {
        return { valid: false, error: 'Invalid token signature' }
    }

    // 2. Decode payload
    try {
        const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8')
        const payload = JSON.parse(jsonStr)

        // 3. Check expiration
        if (!payload.expiresAt || Date.now() > payload.expiresAt) {
            return { valid: false, error: 'Session expired' }
        }

        // 4. Verify admin email
        const { email: adminEmail } = getAdminCredentials()
        if (payload.email !== adminEmail) {
            return { valid: false, error: 'Admin email mismatch' }
        }

        return { valid: true, payload }
    } catch {
        return { valid: false, error: 'Failed to decode session payload' }
    }
}

/**
 * Cookie options for admin session cookie
 */
export function getAdminCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production'
    return {
        name: COOKIE_NAME,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    }
}

export { COOKIE_NAME, SESSION_DURATION_MS }
