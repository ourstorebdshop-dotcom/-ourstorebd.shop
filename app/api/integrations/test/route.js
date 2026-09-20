import { NextResponse } from 'next/server'
import { testTelegramConnection } from '@/lib/integrations/telegram'
import { testGoogleSheetsConnection } from '@/lib/integrations/googleSheets'
import { getStoredIntegrationsSettings } from '@/lib/integrations/syncEngine'
import { serverSaveDoc as saveDocToFirestore } from '@/lib/firestoreServer'
import { verifyAdminAccess } from '@/lib/integrations/adminAuthGuard'

/**
 * POST /api/integrations/test
 * Test connection for Telegram or Google Sheets (Admin Authorized)
 */
export async function POST(request) {
    const auth = verifyAdminAccess(request, { maxRequests: 15 })
    if (!auth.authorized) return auth.response

    try {
        const body = await request.json().catch(() => ({}))
        const { service, config } = body

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'সার্ভিস নাম উল্লেখ করুন (telegram বা google_sheets)' },
                { status: 400 }
            )
        }

        const storedSettings = await getStoredIntegrationsSettings()

        if (service === 'telegram') {
            let botToken = config?.botToken?.trim()
            // If token wasn't provided or was masked, use stored token
            if (!botToken || botToken.includes('••••')) {
                botToken = storedSettings.telegram?.botToken || ''
            }
            const chatId = config?.chatId || storedSettings.telegram?.chatId

            if (!botToken) {
                return NextResponse.json({
                    success: false,
                    error: 'টেলিগ্রাম Bot Token প্রদান করা হয়নি বা পূর্বে সংরক্ষিত নেই।'
                }, { status: 400 })
            }

            const result = await testTelegramConnection(botToken, chatId)

            // Update test status in stored settings
            const updatedTelegram = {
                ...storedSettings.telegram,
                lastTested: new Date().toISOString(),
                testStatus: result.success ? 'SUCCESS' : 'FAILED',
            }
            saveDocToFirestore('settings', 'integrations', {
                ...storedSettings,
                telegram: updatedTelegram,
            }).catch(() => {})

            return NextResponse.json(result)
        }

        if (service === 'google_sheets') {
            const sheetConfig = {
                ...storedSettings.googleSheets,
                ...(config || {}),
                authSecret: config?.authSecret ?? storedSettings.googleSheets?.authSecret ?? '',
            }

            const result = await testGoogleSheetsConnection(sheetConfig)

            // Update test status in stored settings
            const updatedGoogleSheets = {
                ...storedSettings.googleSheets,
                lastTested: new Date().toISOString(),
                testStatus: result.success ? 'SUCCESS' : 'FAILED',
            }
            saveDocToFirestore('settings', 'integrations', {
                ...storedSettings,
                googleSheets: updatedGoogleSheets,
            }).catch(() => {})

            return NextResponse.json(result)
        }

        return NextResponse.json(
            { success: false, error: 'অজানা সার্ভিস।' },
            { status: 400 }
        )

    } catch (err) {
        console.error('[API] Integration test error:', err)
        return NextResponse.json(
            { success: false, error: err.message || 'কানেকশন টেস্ট ব্যর্থ হয়েছে।' },
            { status: 500 }
        )
    }
}
