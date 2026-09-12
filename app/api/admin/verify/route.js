import { NextResponse } from 'next/server'
import { verifyAdminSessionToken, COOKIE_NAME } from '@/lib/security/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json(
                { authenticated: false, message: 'No session token' },
                { status: 401 }
            )
        }

        const result = verifyAdminSessionToken(token)

        if (!result.valid) {
            const response = NextResponse.json(
                { authenticated: false, error: result.error },
                { status: 401 }
            )
            // Clear invalid cookie
            response.cookies.delete(COOKIE_NAME)
            return response
        }

        return NextResponse.json({
            authenticated: true,
            email: result.payload.email,
            expiresAt: result.payload.expiresAt,
        })
    } catch {
        return NextResponse.json(
            { authenticated: false, error: 'Verification failed' },
            { status: 500 }
        )
    }
}
