import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getStoredIntegrationsSettings } from '@/lib/integrations/syncEngine'
import { maskBotToken } from '@/lib/integrations/telegram'
import { serverSaveDoc as saveDocToFirestore } from '@/lib/firestoreServer'
import { defaultIntegrationsSettings } from '@/lib/features/integrations/integrationsSlice'
import { verifyAdminAccess } from '@/lib/integrations/adminAuthGuard'

/**
 * GET /api/integrations/settings
 * Fetch saved integrations settings with masked sensitive credentials
 */
export async function GET(request) {
    const auth = verifyAdminAccess(request)
    if (!auth.authorized) return auth.response

    try {
        const settings = await getStoredIntegrationsSettings()

        // Generate an authSecret if not yet present
        const currentAuthSecret = settings.googleSheets?.authSecret || crypto.randomBytes(16).toString('hex')

        // Return masked settings to frontend so secrets are NEVER leaked
        const safeSettings = {
            ...settings,
            telegram: {
                ...settings.telegram,
                botTokenMasked: maskBotToken(settings.telegram?.botToken),
                isTokenConfigured: Boolean(settings.telegram?.botToken?.trim()),
                botToken: '', // Do NOT return raw bot token to the browser
            },
            googleSheets: {
                ...settings.googleSheets,
                authSecret: currentAuthSecret,
            },
        }

        return NextResponse.json({ success: true, settings: safeSettings })
    } catch (err) {
        console.error('[API] Failed to get integrations settings:', err)
        return NextResponse.json(
            { success: false, error: 'সেটিংস লোড করা সম্ভব হয়নি।' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/integrations/settings
 * Save integrations settings to Firestore (with secret retention logic)
 */
export async function POST(request) {
    const auth = verifyAdminAccess(request)
    if (!auth.authorized) return auth.response

    try {
        const body = await request.json().catch(() => ({}))
        const existing = await getStoredIntegrationsSettings()

        // Token retention: If client sends empty or masked token, keep existing token
        let finalBotToken = existing.telegram?.botToken || ''
        const incomingToken = body.telegram?.botToken?.trim()
        if (incomingToken && !incomingToken.includes('••••')) {
            finalBotToken = incomingToken
        }

        const updatedTelegram = {
            ...defaultIntegrationsSettings.telegram,
            ...(existing.telegram || {}),
            ...(body.telegram || {}),
            botToken: finalBotToken,
        }

        const updatedGoogleSheets = {
            ...defaultIntegrationsSettings.googleSheets,
            ...(existing.googleSheets || {}),
            ...(body.googleSheets || {}),
            authSecret: body.googleSheets?.authSecret?.trim() || existing.googleSheets?.authSecret || crypto.randomBytes(16).toString('hex'),
        }

        const updatedSettings = {
            ...defaultIntegrationsSettings,
            ...existing,
            ...body,
            telegram: updatedTelegram,
            googleSheets: updatedGoogleSheets,
            syncStats: {
                ...defaultIntegrationsSettings.syncStats,
                ...(existing.syncStats || {}),
            },
            updatedAt: new Date().toISOString(),
        }

        const saved = await saveDocToFirestore('settings', 'integrations', updatedSettings)
        if (!saved) {
            return NextResponse.json(
                { success: false, error: 'ডাটাবেজে সেটিংস সংরক্ষণ করা যায়নি।' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'ইন্টিগ্রেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',
            settings: {
                ...updatedSettings,
                telegram: {
                    ...updatedTelegram,
                    botTokenMasked: maskBotToken(updatedTelegram.botToken),
                    isTokenConfigured: Boolean(updatedTelegram.botToken?.trim()),
                    botToken: '',
                }
            },
        })
    } catch (err) {
        console.error('[API] Failed to save integrations settings:', err)
        return NextResponse.json(
            { success: false, error: err.message || 'সেটিংস সেভ করতে সমস্যা হয়েছে।' },
            { status: 500 }
        )
    }
}
