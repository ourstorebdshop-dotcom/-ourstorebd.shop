import { NextResponse } from 'next/server'
import { retryOrderSync, syncOrderIntegrations, retryAllFailedOrders } from '@/lib/integrations/syncEngine'
import { verifyAdminAccess } from '@/lib/integrations/adminAuthGuard'

/**
 * POST /api/integrations/sync
 * Manually sync, retry an order, or bulk retry all failed orders (Admin Authorized)
 */
export async function POST(request) {
    const auth = verifyAdminAccess(request, { maxRequests: 20 })
    if (!auth.authorized) return auth.response

    try {
        const body = await request.json().catch(() => ({}))
        const { action = 'retry', orderId, service = 'all', order } = body

        const origin = request.nextUrl?.origin || 'https://ourstorebd.shop'

        // Action 1: Bulk retry all failed orders
        if (action === 'retry_all_failed' || action === 'retry_all') {
            const result = await retryAllFailedOrders(origin)
            return NextResponse.json(result)
        }

        // Action 2: Retry single order
        if (action === 'retry' || (action === 'manual_sync' && orderId && !order)) {
            if (!orderId) {
                return NextResponse.json(
                    { success: false, error: 'Order ID প্রদান করুন।' },
                    { status: 400 }
                )
            }

            const result = await retryOrderSync(orderId, service, origin)
            return NextResponse.json(result)
        }

        // Action 3: Manual sync with order payload
        if (action === 'manual_sync' && order) {
            const result = await syncOrderIntegrations(order, origin, null, { force: true })
            return NextResponse.json(result)
        }

        return NextResponse.json(
            { success: false, error: 'অকার্যকর সিঙ্ক রিকোয়েস্ট।' },
            { status: 400 }
        )

    } catch (err) {
        console.error('[API] Integration sync error:', err)
        return NextResponse.json(
            { success: false, error: err.message || 'সিঙ্ক ব্যর্থ হয়েছে।' },
            { status: 500 }
        )
    }
}
