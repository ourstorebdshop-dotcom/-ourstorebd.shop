import { NextResponse } from 'next/server'
import { verifyAdminSessionToken, COOKIE_NAME, getAdminCredentials, constantTimeCompare } from '../security/auth.js'
import { checkRateLimit } from '../fraud/rateLimiter.js'

/**
 * Extract client IP from request headers
 */
export function getClientIP(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        '127.0.0.1'
    )
}

/**
 * Guard that verifies admin authentication across all integration API endpoints
 * 
 * Checks:
 * 1. HttpOnly admin session cookie (gocart_admin_session)
 * 2. Authorization Bearer header
 * 3. x-admin-token or x-admin-secret header (for programmatic/automated testing)
 */
export function verifyAdminAccess(request, options = {}) {
    const ip = getClientIP(request)

    // Rate Limiting (default 30 requests per minute per IP)
    const limitMax = options.maxRequests || 30
    const limitWindow = options.windowMs || 60 * 1000
    const rateCheck = checkRateLimit(`admin_api:${ip}`, limitMax, limitWindow)
    if (!rateCheck.allowed) {
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, error: 'অতিরিক্ত অনুরোধ করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন (Rate limit exceeded)।' },
                { status: 429 }
            ),
        }
    }

    // 1. Check Session Token (Cookie or Bearer header or custom header)
    const token = request.cookies?.get(COOKIE_NAME)?.value ||
                  request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
                  request.headers.get('x-admin-token')

    if (token) {
        const auth = verifyAdminSessionToken(token)
        if (auth.valid) {
            return { authorized: true, payload: auth.payload }
        }
    }

    // 2. Check X-Admin-Secret header (for authorized server scripts & automated test suites)
    const secretHeader = request.headers.get('x-admin-secret')
    if (secretHeader) {
        const { password } = getAdminCredentials()
        if (constantTimeCompare(secretHeader, password)) {
            return { authorized: true, payload: { email: 'admin_secret_auth' } }
        }
    }

    // Unauthorized response
    return {
        authorized: false,
        response: NextResponse.json(
            {
                success: false,
                error: 'Unauthorized: এই অ্যাকশনটি শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য সংরক্ষিত।',
                code: 'UNAUTHORIZED_ADMIN'
            },
            { status: 401 }
        ),
    }
}
