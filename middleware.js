import { NextResponse } from 'next/server'

// Security Headers definitions
const SECURITY_HEADERS = {
    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    // Clickjacking protection (allow same-origin for modals/embeds)
    'X-Frame-Options': 'SAMEORIGIN',
    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Restrict unnecessary browser APIs
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    // Force HTTPS (HSTS)
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    // Cross-Origin Opener Policy
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

// Content Security Policy compatible with Next.js, Firebase, Cloudinary, Google & Meta Tracking
const CSP_HEADER = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebasestorage.app https://graph.facebook.com https://www.google-analytics.com https://analytics.google.com https://res.cloudinary.com https://api.cloudinary.com wss:",
    "frame-src 'self' https://accounts.google.com https://www.facebook.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ')

/**
 * Validate Origin / Referer for CSRF prevention on state-changing API requests
 */
function isAllowedOrigin(request) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // If no origin/referer (e.g. direct server-to-server or mobile app), allow
    if (!origin && !referer) return true

    if (origin) {
        try {
            const originUrl = new URL(origin)
            if (originUrl.host === host) return true
            // Allow localhost/127.0.0.1 in development
            if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
                if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') return true
            }
        } catch {
            return false
        }
    }

    if (referer) {
        try {
            const refererUrl = new URL(referer)
            if (refererUrl.host === host) return true
            if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
                if (refererUrl.hostname === 'localhost' || refererUrl.hostname === '127.0.0.1') return true
            }
        } catch {
            return false
        }
    }

    return false
}

export async function middleware(request) {
    const { pathname } = request.nextUrl
    const method = request.method

    // ── 1. CSRF Protection for API Mutations ──────────────────────────
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // Exempt public tracking dispatch from strict origin if needed, but verify for admin/order
        if (!isAllowedOrigin(request)) {
            return NextResponse.json(
                { error: 'Cross-Site Request Blocked (Invalid Origin).' },
                { status: 403 }
            )
        }
    }

    // ── 2. Admin API Authorization Guard ──────────────────────────────
    // Protect all /api/admin/* routes (except /api/admin/login)
    if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login') {
        const sessionCookie = request.cookies.get('gocart_admin_session')?.value
        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin session required.' },
                { status: 401 }
            )
        }
    }

    // ── 3. Attach Security Headers to All Responses ───────────────────
    const response = NextResponse.next()

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value)
    }

    // Only apply strict CSP to document pages (not API or Next internal files)
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        response.headers.set('Content-Security-Policy', CSP_HEADER)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
