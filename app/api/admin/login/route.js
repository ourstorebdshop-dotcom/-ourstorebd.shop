import { NextResponse } from 'next/server'
import {
    getAdminCredentials,
    constantTimeCompare,
    createAdminSessionToken,
    getAdminCookieOptions,
    COOKIE_NAME,
    SESSION_DURATION_MS
} from '@/lib/security/auth'
import { checkRateLimit } from '@/lib/fraud/rateLimiter'

// In-memory lockout tracker for escalation
const lockoutHistory = new Map() // ip -> { lockoutCount, lockedUntil }

function getClientIP(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        '127.0.0.1'
    )
}

export async function POST(request) {
    try {
        const ip = getClientIP(request)
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const now = Date.now()

        // 1. Check existing lockout
        const history = lockoutHistory.get(ip) || { lockoutCount: 0, lockedUntil: 0 }
        if (history.lockedUntil > now) {
            const remainingSec = Math.ceil((history.lockedUntil - now) / 1000)
            return NextResponse.json(
                {
                    error: `একাধিক ভুল প্রচেষ্টার কারণে একাউন্ট সাময়িকভাবে লক করা হয়েছে।`,
                    locked: true,
                    lockoutRemaining: remainingSec,
                    lockoutCount: history.lockoutCount,
                },
                { status: 429 }
            )
        }

        // 2. Parse request body
        const body = await request.json().catch(() => ({}))
        const { email = '', password = '' } = body

        const inputEmail = String(email).trim().toLowerCase()
        const inputPassword = String(password)

        if (!inputEmail || !inputPassword) {
            return NextResponse.json(
                { error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' },
                { status: 400 }
            )
        }

        // 3. Rate limiting check (5 attempts per 5 minutes per IP)
        const rateCheck = checkRateLimit(`admin_login:${ip}`, 5, 5 * 60 * 1000)

        // 4. Verify credentials
        const { email: adminEmail, password: adminPassword } = getAdminCredentials()
        const emailMatches = constantTimeCompare(inputEmail, adminEmail)
        const passwordMatches = constantTimeCompare(inputPassword, adminPassword)

        if (!emailMatches || !passwordMatches) {
            // Check if rate limit reached
            if (!rateCheck.allowed) {
                const newLockCount = history.lockoutCount + 1
                // 5m, 10m, 20m, max 60m
                const durationMs = Math.min(5 * 60 * 1000 * Math.pow(2, newLockCount - 1), 60 * 60 * 1000)
                const lockedUntil = now + durationMs
                lockoutHistory.set(ip, { lockoutCount: newLockCount, lockedUntil })

                const durationMins = Math.ceil(durationMs / 60000)
                return NextResponse.json(
                    {
                        error: `৫ বার ভুল চেষ্টা! ${durationMins} মিনিটের জন্য লক করা হয়েছে।`,
                        locked: true,
                        lockoutRemaining: Math.ceil(durationMs / 1000),
                        lockoutCount: newLockCount,
                    },
                    { status: 429 }
                )
            }

            const attemptsLeft = rateCheck.remaining
            return NextResponse.json(
                {
                    error: `ভুল ইমেইল অথবা পাসওয়ার্ড! আর ${attemptsLeft} বার চেষ্টা করতে পারবেন।`,
                    remainingAttempts: attemptsLeft,
                },
                { status: 401 }
            )
        }

        // Success: Reset IP lockout history
        lockoutHistory.delete(ip)

        // 5. Generate secure HMAC-SHA256 session token
        const token = createAdminSessionToken(adminEmail, ip, userAgent)
        const cookieOpts = getAdminCookieOptions()

        const response = NextResponse.json({
            success: true,
            message: 'এডমিন অথেনটিকেশন সফল হয়েছে!',
            session: {
                email: adminEmail,
                expiresAt: now + SESSION_DURATION_MS,
            },
        })

        // Set HttpOnly, Secure, SameSite cookie
        response.cookies.set(cookieOpts.name, token, {
            httpOnly: cookieOpts.httpOnly,
            secure: cookieOpts.secure,
            sameSite: cookieOpts.sameSite,
            path: cookieOpts.path,
            maxAge: cookieOpts.maxAge,
        })

        return response
    } catch (error) {
        return NextResponse.json(
            { error: 'অভ্যন্তরীণ নিরাপত্তা যাচাইয়ে ত্রুটি হয়েছে।' },
            { status: 500 }
        )
    }
}
