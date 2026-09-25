import { NextResponse } from 'next/server'
import { verifyAdminSessionToken, COOKIE_NAME } from '@/lib/security/auth'
import { getActiveVisitors } from '@/lib/presence/presenceService'

export const dynamic = 'force-dynamic'

/**
 * Admin Presence Read Endpoint
 * Delivers real-time active visitor metrics to authenticated administrators
 */
export async function GET(request) {
    try {
        // 1. Authenticate Admin Session
        const token = request.cookies.get(COOKIE_NAME)?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin session required' },
                { status: 401 }
            )
        }

        const authResult = verifyAdminSessionToken(token)
        if (!authResult.valid) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid admin session token' },
                { status: 401 }
            )
        }

        // 2. Fetch Live Active Visitors Statistics
        const presenceData = await getActiveVisitors()

        const response = NextResponse.json({
            success: true,
            ...presenceData,
        })

        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        return response
    } catch {
        return NextResponse.json(
            { error: 'Failed to retrieve live visitor data' },
            { status: 500 }
        )
    }
}
