import { NextResponse } from 'next/server'
import { recordHeartbeat } from '@/lib/presence/presenceService'

export const dynamic = 'force-dynamic'

const MAX_PAYLOAD_BYTES = 2048 // 2 KB strict limit

/**
 * Public Heartbeat API Endpoint
 * Handles invisible, lightweight heartbeats from client visitors
 */
export async function POST(request) {
    try {
        // 1. Strict Request Size Limitation
        const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
        if (contentLength > MAX_PAYLOAD_BYTES) {
            return NextResponse.json(
                { error: 'Payload Too Large' },
                { status: 413 }
            )
        }

        // 2. Parse Body Safely (handles JSON or beacon text/plain)
        let body = null
        const rawText = await request.text()
        if (rawText.length > MAX_PAYLOAD_BYTES) {
            return NextResponse.json(
                { error: 'Payload Too Large' },
                { status: 413 }
            )
        }

        if (!rawText.trim()) {
            return NextResponse.json(
                { error: 'Empty payload' },
                { status: 400 }
            )
        }

        try {
            body = JSON.parse(rawText)
        } catch {
            return NextResponse.json(
                { error: 'Malformed JSON payload' },
                { status: 400 }
            )
        }

        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { error: 'Invalid payload structure' },
                { status: 400 }
            )
        }

        const { sessionId, page, referrer, isLeaving, startedAt } = body

        // 3. Strict Validation & Invalid Session Rejection
        if (!sessionId || typeof sessionId !== 'string') {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        if (!/^[a-zA-Z0-9_-]{16,64}$/.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format' },
                { status: 400 }
            )
        }

        // Extract client headers
        const userAgent = request.headers.get('user-agent') || ''
        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown')

        // 4. Record Heartbeat in Isolated Presence Service
        const result = await recordHeartbeat({
            sessionId,
            page: typeof page === 'string' ? page : '/',
            referrer: typeof referrer === 'string' ? referrer : '',
            userAgent,
            ip,
            startedAt: typeof startedAt === 'number' ? startedAt : null,
            isLeaving: Boolean(isLeaving),
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to process heartbeat' },
                { status: result.status || 400 }
            )
        }

        const res = NextResponse.json({ ok: true }, { status: 200 })
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        return res
    } catch (e) {
        console.error('[Heartbeat Error]:', e)
        return NextResponse.json(
            { error: 'Heartbeat processing error' },
            { status: 500 }
        )
    }
}
