import { NextResponse } from 'next/server'
import { getStoredIntegrationsSettings } from '@/lib/integrations/syncEngine'
import { serverSaveDoc as saveDocToFirestore } from '@/lib/firestoreServer'
import { verifyAdminAccess } from '@/lib/integrations/adminAuthGuard'

/**
 * GET /api/integrations/logs
 * Retrieve integration sync logs and stats (Admin Authorized)
 */
export async function GET(request) {
    const auth = verifyAdminAccess(request)
    if (!auth.authorized) return auth.response

    try {
        const settings = await getStoredIntegrationsSettings()
        return NextResponse.json({
            success: true,
            logs: settings.syncLogs || [],
            stats: settings.syncStats || {},
        })
    } catch (err) {
        console.error('[API] Failed to get integration logs:', err)
        return NextResponse.json(
            { success: false, error: 'লগ ডাটা লোড করা সম্ভব হয়নি।' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/integrations/logs
 * Clear all sync logs (Admin Authorized)
 */
export async function DELETE(request) {
    const auth = verifyAdminAccess(request)
    if (!auth.authorized) return auth.response

    try {
        const settings = await getStoredIntegrationsSettings()
        const updated = {
            ...settings,
            syncLogs: [],
            syncStats: {
                ...settings.syncStats,
                failedCount: 0,
                lastError: null,
            },
        }

        await saveDocToFirestore('settings', 'integrations', updated)

        return NextResponse.json({
            success: true,
            message: 'সকল সিঙ্ক লগ সফলভাবে মুছে ফেলা হয়েছে!',
        })
    } catch (err) {
        console.error('[API] Failed to clear integration logs:', err)
        return NextResponse.json(
            { success: false, error: 'লগ মুছে ফেলতে সমস্যা হয়েছে।' },
            { status: 500 }
        )
    }
}
