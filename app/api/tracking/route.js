import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { verifyAdminSessionToken, COOKIE_NAME } from '@/lib/security/auth'
import { checkRateLimit } from '@/lib/fraud/rateLimiter'

/**
 * SHA-256 hashing for Meta CAPI Advanced Matching
 */
function hashValue(value) {
    if (!value || typeof value !== 'string') return null
    const cleaned = value.trim().toLowerCase()
    if (!cleaned) return null
    return crypto.createHash('sha256').update(cleaned).digest('hex')
}

/**
 * Normalize Bangladeshi phone number for Meta CAPI E.164 (+880...)
 */
function normalizePhoneForCAPI(phone) {
    if (!phone) return null
    let digits = String(phone).replace(/[^0-9]/g, '')
    if (digits.startsWith('880')) {
        digits = digits.slice(2)
    }
    if (digits.startsWith('0')) {
        digits = digits.slice(1)
    }
    if (digits.length === 10) {
        return hashValue('880' + digits)
    }
    return hashValue(digits)
}

/**
 * Extract client IP from headers
 */
function getClientIP(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        '127.0.0.1'
    )
}

/**
 * Extract cookies (specifically _fbp and _fbc)
 */
function getFbpFbc(request, body) {
    let fbp = body?.fbp || null
    let fbc = body?.fbc || null

    if (!fbp || !fbc) {
        const cookieHeader = request.headers.get('cookie') || ''
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
                const [k, ...v] = c.trim().split('=')
                return [k, v.join('=')]
            })
        )
        if (!fbp && cookies._fbp) fbp = cookies._fbp
        if (!fbc && cookies._fbc) fbc = cookies._fbc
    }

    return { fbp, fbc }
}

/**
 * Load server-side tracking settings from Firestore if not provided in body
 */
async function getTrackingSettings() {
    if (isFirebaseConfigured()) {
        try {
            const snap = await getDoc(doc(db, 'settings', 'tracking'))
            if (snap.exists()) {
                return snap.data()
            }
        } catch (e) {
            console.warn('[TrackingAPI] Failed to load tracking settings from Firestore:', e)
        }
    }
    return null
}

/**
 * Send event payload to Meta Conversions API Graph Endpoint
 */
async function sendToMetaCAPI({ pixelId, accessToken, eventData, testEventCode }) {
    if (!pixelId || !accessToken) {
        return { success: false, error: 'Missing Pixel ID or Access Token' }
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId.trim()}/events?access_token=${accessToken.trim()}`
    const payload = {
        data: [eventData],
    }

    if (testEventCode && String(testEventCode).trim()) {
        payload.test_event_code = String(testEventCode).trim()
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const resJson = await response.json()
        if (!response.ok || resJson.error) {
            return {
                success: false,
                status: response.status,
                error: resJson.error?.message || 'Meta API error',
                details: resJson.error,
            }
        }

        return {
            success: true,
            status: response.status,
            data: resJson,
        }
    } catch (err) {
        return {
            success: false,
            error: err.message || 'Network error calling Meta CAPI',
        }
    }
}

/**
 * POST /api/tracking
 * Handles:
 * - Direct Meta CAPI dispatch (Purchase, AddToCart, etc.)
 * - Test connection runner
 * - Audit logging
 */
export async function POST(request) {
    try {
        const ip = getClientIP(request)
        const userAgent = request.headers.get('user-agent') || ''

        // Rate limiting check: max 60 requests per minute per IP
        const trackingRate = checkRateLimit(`tracking_api:${ip}`, 60, 60 * 1000)
        if (!trackingRate.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too Many Requests (Rate limit exceeded).' },
                { status: 429 }
            )
        }

        const body = await request.json().catch(() => ({}))

        const {
            action = 'DISPATCH_EVENT', // 'DISPATCH_EVENT' | 'TEST_CONNECTION'
            eventName,
            eventId,
            eventSourceUrl,
            customData = {},
            userData = {},
            testEventCode: explicitTestCode,
        } = body

        // 1. Load active settings from Firestore or merge with explicit parameters
        const savedSettings = await getTrackingSettings()
        const metaSettings = savedSettings?.meta || {}
        
        // Priority: explicitly provided credentials (for test connection in admin) or saved Firestore credentials
        const pixelId = body.pixelId || metaSettings.pixelId || ''
        const pixelId2 = body.pixelId2 || metaSettings.pixelId2 || ''
        const accessToken = body.accessToken || metaSettings.accessToken || ''
        const testEventCode = explicitTestCode !== undefined ? explicitTestCode : (metaSettings.testEventCode || '')
        const capiEnabled = body.force || metaSettings.capiEnabled || false

        if (action === 'TEST_CONNECTION') {
            // Require verified admin session for testing connection
            const adminToken = request.cookies.get(COOKIE_NAME)?.value ||
                               request.headers.get('authorization')?.replace('Bearer ', '')
            const authCheck = verifyAdminSessionToken(adminToken)
            if (!authCheck.valid) {
                return NextResponse.json({
                    success: false,
                    error: 'Unauthorized: এই অ্যাকশন শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য প্রযোজ্য।',
                }, { status: 401 })
            }

            if (!pixelId || !accessToken) {
                return NextResponse.json({
                    success: false,
                    error: 'Pixel ID এবং Conversions API Access Token উভয়ই প্রয়োজন।',
                }, { status: 400 })
            }

            const testEventData = {
                event_name: 'TestEvent',
                event_time: Math.floor(Date.now() / 1000),
                event_id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                event_source_url: eventSourceUrl || 'https://ourstorebd.shop/admin/tracking',
                action_source: 'website',
                user_data: {
                    client_ip_address: ip,
                    client_user_agent: userAgent,
                    em: [hashValue('test@ourstorebd.shop')],
                },
                custom_data: {
                    currency: 'BDT',
                    value: 100,
                    status: 'connection_verification',
                },
            }

            const metaRes = await sendToMetaCAPI({
                pixelId,
                accessToken,
                eventData: testEventData,
                testEventCode: testEventCode || 'TEST_GOCART',
            })

            return NextResponse.json({
                success: metaRes.success,
                metaResponse: metaRes,
                message: metaRes.success 
                    ? 'Meta Conversions API সফলভাবে কানেক্ট হয়েছে এবং টেস্ট ইভেন্ট গ্রহণ করেছে!' 
                    : `Meta API Error: ${metaRes.error}`,
            })
        }

        // Action: DISPATCH_EVENT
        if (!capiEnabled) {
            return NextResponse.json({
                success: true,
                message: 'CAPI is disabled in settings. Event ignored.',
                skipped: true,
            })
        }

        if (!pixelId || !accessToken) {
            return NextResponse.json({
                success: false,
                error: 'CAPI is enabled but Pixel ID or Access Token is missing.',
            }, { status: 400 })
        }

        const { fbp, fbc } = getFbpFbc(request, body)

        // Build Meta CAPI Event Object
        const finalEventId = eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const capiEventData = {
            event_name: eventName || 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: finalEventId,
            event_source_url: eventSourceUrl || request.headers.get('referer') || 'https://ourstorebd.shop',
            action_source: 'website',
            user_data: {
                client_ip_address: ip,
                client_user_agent: userAgent,
                ...(userData.email ? { em: [hashValue(userData.email)] } : {}),
                ...(userData.phone ? { ph: [normalizePhoneForCAPI(userData.phone)] } : {}),
                ...(userData.name ? { fn: [hashValue(userData.name.split(' ')[0])] } : {}),
                ...(userData.city ? { ct: [hashValue(userData.city)] } : {}),
                country: [hashValue('bd')],
                ...(fbp ? { fbp } : {}),
                ...(fbc ? { fbc } : {}),
            },
            custom_data: {
                currency: customData.currency || 'BDT',
                value: typeof customData.value === 'number' ? customData.value : Number(customData.value || 0),
                ...(customData.contents ? { contents: customData.contents } : {}),
                ...(customData.content_type ? { content_type: customData.content_type } : { content_type: 'product' }),
                ...(customData.order_id ? { order_id: String(customData.order_id) } : {}),
                ...(customData.coupon ? { coupon: customData.coupon } : {}),
                ...(customData.shipping ? { delivery_category: customData.shipping } : {}),
            },
        }

        // Send to Primary Pixel
        const primaryRes = await sendToMetaCAPI({
            pixelId,
            accessToken,
            eventData: capiEventData,
            testEventCode,
        })

        // If secondary Pixel is enabled, dispatch in parallel
        let secondaryRes = null
        if (pixelId2 && String(pixelId2).trim()) {
            secondaryRes = await sendToMetaCAPI({
                pixelId: pixelId2,
                accessToken,
                eventData: capiEventData,
                testEventCode,
            })
        }

        // Log event to Firestore tracking_logs for admin dashboard
        if (isFirebaseConfigured()) {
            try {
                const logDoc = {
                    id: finalEventId,
                    timestamp: new Date().toISOString(),
                    eventName: eventName || 'Purchase',
                    platforms: ['Meta CAPI'],
                    status: primaryRes.success ? 'SUCCESS' : 'FAILED',
                    source: 'SERVER_CAPI',
                    eventId: finalEventId,
                    orderId: customData.order_id || null,
                    value: customData.value || 0,
                    currency: customData.currency || 'BDT',
                    error: primaryRes.error || null,
                    metaResult: primaryRes.data || null,
                }
                await setDoc(doc(db, 'tracking_logs', finalEventId), logDoc)
            } catch (e) {
                // Non-blocking log write failure
            }
        }

        return NextResponse.json({
            success: primaryRes.success,
            eventId: finalEventId,
            primaryResult: primaryRes,
            secondaryResult: secondaryRes,
        })

    } catch (err) {
        console.error('[TrackingAPI] Unexpected Error:', err)
        return NextResponse.json({
            success: false,
            error: err.message || 'Internal server error processing tracking event',
        }, { status: 500 })
    }
}

/**
 * GET /api/tracking
 * Returns sanitized public tracking config
 */
export async function GET() {
    try {
        const savedSettings = await getTrackingSettings()
        if (!savedSettings) {
            return NextResponse.json({ enabled: false })
        }

        // Sanitize sensitive credentials: DO NOT return accessToken to client
        const safeConfig = {
            meta: {
                enabled: savedSettings.meta?.enabled || false,
                pixelId: savedSettings.meta?.pixelId || '',
                pixelId2: savedSettings.meta?.pixelId2 || '',
                capiEnabled: savedSettings.meta?.capiEnabled || false,
                testEventCode: savedSettings.meta?.testEventCode || '',
                trackPurchases: savedSettings.meta?.trackPurchases !== false,
                trackAddToCart: savedSettings.meta?.trackAddToCart !== false,
                trackInitiateCheckout: savedSettings.meta?.trackInitiateCheckout !== false,
                trackViewContent: savedSettings.meta?.trackViewContent !== false,
                trackSearch: savedSettings.meta?.trackSearch !== false,
                trackLead: savedSettings.meta?.trackLead !== false,
                trackContact: savedSettings.meta?.trackContact !== false,
            },
            googleAds: {
                enabled: savedSettings.googleAds?.enabled || false,
                conversionId: savedSettings.googleAds?.conversionId || '',
                purchaseLabel: savedSettings.googleAds?.purchaseLabel || '',
                addToCartLabel: savedSettings.googleAds?.addToCartLabel || '',
                beginCheckoutLabel: savedSettings.googleAds?.beginCheckoutLabel || '',
                enhancedConversions: savedSettings.googleAds?.enhancedConversions !== false,
            },
            ga4: {
                enabled: savedSettings.ga4?.enabled || false,
                measurementId: savedSettings.ga4?.measurementId || '',
                ecommerceEnabled: savedSettings.ga4?.ecommerceEnabled !== false,
            },
            gtm: {
                enabled: savedSettings.gtm?.enabled || false,
                containerId: savedSettings.gtm?.containerId || '',
            },
            customScripts: {
                enabled: savedSettings.customScripts?.enabled || false,
                headScript: savedSettings.customScripts?.headScript || '',
                bodyTopScript: savedSettings.customScripts?.bodyTopScript || '',
                bodyBottomScript: savedSettings.customScripts?.bodyBottomScript || '',
            },
            eventsConfig: savedSettings.eventsConfig || {},
            consent: savedSettings.consent || {},
            debug: savedSettings.debug || {},
        }

        return NextResponse.json(safeConfig)
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
