import { adminDb } from '../firebaseAdmin.js'
import adminApp from '../firebaseAdmin.js'
import { detectDeviceAndBrowser } from './deviceDetector.js'

/**
 * Production-Hardened Distributed Live Presence Service
 *
 * Architecture:
 * - Dual-Driver Engine:
 *     1. Primary: Firebase Realtime Database (if FIREBASE_DATABASE_URL is configured)
 *     2. Distributed Authoritative: Cloud Firestore isolated collection (_live_presence_sessions)
 * - 100% Stateless & Distributed: Safe for Vercel / serverless multi-instance concurrency
 * - No dependency on in-memory state as source of truth
 * - No single-document snapshot overwrites
 * - Atomic per-session records keyed by sessionId
 * - Robust 45-second inactivity timeout
 * - Background garbage collection for dead sessions older than 3 minutes
 */

const ACTIVE_TIMEOUT_MS = 45 * 1000 // 45 seconds threshold
const GC_INTERVAL_MS = 60 * 1000     // Run stale doc GC at most once per 60s
const RATE_LIMIT_WINDOW_MS = 6000    // Minimum 6s between heartbeats per session on local instance
const COLLECTION_NAME = '_live_presence_sessions'

// Process-local short-lived rate limiter to shield the database from rapid spam
if (!globalThis.__GOCART_PRESENCE_LIMITER__) {
    globalThis.__GOCART_PRESENCE_LIMITER__ = {
        rateLimits: new Map(),
        lastGcTime: 0,
    }
}

const limiter = globalThis.__GOCART_PRESENCE_LIMITER__

// Cached RTDB instance reference
let rtdbInstance = null
let rtdbChecked = false

/**
 * Initialize Firebase Realtime Database if configured
 */
async function getRtdb() {
    if (rtdbChecked) return rtdbInstance
    rtdbChecked = true

    const rtdbUrl = process.env.FIREBASE_DATABASE_URL
    if (!rtdbUrl) return null

    try {
        const { getDatabase } = await import('firebase-admin/database')
        const db = getDatabase(adminApp, rtdbUrl)
        // Verify connectivity
        await db.ref('.info/connected').once('value')
        rtdbInstance = db
        return rtdbInstance
    } catch (e) {
        console.warn('[PresenceService] Realtime Database unavailable, using Distributed Firestore Presence Engine:', e.message)
        rtdbInstance = null
        return null
    }
}

/**
 * Sanitize URL pathname to prevent injection and strip sensitive queries
 */
function sanitizePathname(rawPath = '/') {
    if (typeof rawPath !== 'string') return '/'
    let path = rawPath.trim()
    const qIndex = path.indexOf('?')
    if (qIndex !== -1) path = path.slice(0, qIndex)
    const hIndex = path.indexOf('#')
    if (hIndex !== -1) path = path.slice(0, hIndex)
    path = path.replace(/[<>"'`]/g, '')
    if (!path.startsWith('/')) path = '/' + path
    return path.slice(0, 150) || '/'
}

/**
 * Sanitize referrer domain
 */
function sanitizeReferrer(rawReferrer = '') {
    if (!rawReferrer || typeof rawReferrer !== 'string') return 'Direct'
    try {
        const url = new URL(rawReferrer)
        return url.hostname.replace('www.', '').slice(0, 80)
    } catch {
        return 'Direct'
    }
}

/**
 * Background garbage collection for dead sessions older than 3 minutes
 */
async function cleanStaleSessionsFromFirestore() {
    const now = Date.now()
    if (now - limiter.lastGcTime < GC_INTERVAL_MS) return
    limiter.lastGcTime = now

    try {
        if (!adminDb) return
        const staleCutoff = now - (3 * 60 * 1000) // 3 minutes
        const snap = await adminDb.collection(COLLECTION_NAME)
            .where('lastSeen', '<', staleCutoff)
            .limit(50)
            .get()

        if (!snap.empty) {
            const batch = adminDb.batch()
            snap.docs.forEach(doc => batch.delete(doc.ref))
            await batch.commit()
        }

        // Clean local rate limiter map
        const rateLimitCutoff = now - 30000
        for (const [key, val] of limiter.rateLimits.entries()) {
            const ts = typeof val === 'number' ? val : (val?.windowStart || 0)
            if (ts < rateLimitCutoff) limiter.rateLimits.delete(key)
        }
    } catch {
        // Non-blocking
    }
}

/**
 * Record a heartbeat from a visitor (distributed and authoritative)
 */
export async function recordHeartbeat({
    sessionId,
    page = '/',
    referrer = '',
    userAgent = '',
    ip = 'unknown',
    startedAt = null,
    isLeaving = false,
}) {
    if (!sessionId || typeof sessionId !== 'string') {
        return { success: false, error: 'Invalid session ID', status: 400 }
    }

    if (!/^[a-zA-Z0-9_-]{16,64}$/.test(sessionId)) {
        return { success: false, error: 'Malformed session ID format', status: 400 }
    }

    const now = Date.now()

    // 1. Bot detection
    const deviceInfo = detectDeviceAndBrowser(userAgent)
    if (deviceInfo.isBot) {
        return { success: true, ignored: true }
    }

    const rtdb = await getRtdb()

    // 2. Handle departure (leave signal)
    if (isLeaving) {
        if (rtdb) {
            try {
                await rtdb.ref(`_live_presence/${sessionId}`).remove()
            } catch { /* ignore */ }
        } else if (adminDb) {
            try {
                await adminDb.collection(COLLECTION_NAME).doc(sessionId).delete()
            } catch { /* ignore */ }
        }
        return { success: true, status: 200 }
    }

    // 3. Process-level rate limiting check to guard against rapid request spam
    const lastSessionHeartbeat = limiter.rateLimits.get(sessionId) || 0
    if (now - lastSessionHeartbeat < RATE_LIMIT_WINDOW_MS) {
        return { success: true, rateLimited: true }
    }

    // IP sliding window limit (max 30 requests per 10s per IP to allow shared NAT while blocking floods)
    const MAX_REQUESTS_PER_IP_WINDOW = 30
    const ipKey = `ip_${ip}`
    const storedIp = limiter.rateLimits.get(ipKey)
    const ipRecord = (storedIp && typeof storedIp === 'object' && typeof storedIp.count === 'number')
        ? storedIp
        : { count: 0, windowStart: now }

    if (now - ipRecord.windowStart > 10000) {
        ipRecord.count = 1
        ipRecord.windowStart = now
    } else {
        ipRecord.count++
        if (ipRecord.count > MAX_REQUESTS_PER_IP_WINDOW) {
            return { success: false, error: 'Rate limit exceeded', status: 429 }
        }
    }
    limiter.rateLimits.set(ipKey, ipRecord)
    limiter.rateLimits.set(sessionId, now)

    const sanitizedPage = sanitizePathname(page)
    const cleanReferrer = sanitizeReferrer(referrer)

    // 4. Record to Distributed Authoritative Store
    if (rtdb) {
        // Driver 1: Firebase Realtime Database
        try {
            const { ServerValue } = await import('firebase-admin/database')
            const existingStartedSnap = await rtdb.ref(`_live_presence/${sessionId}/startedAt`).once('value')
            const existingStartedAt = existingStartedSnap.val()

            await rtdb.ref(`_live_presence/${sessionId}`).update({
                sessionId,
                page: sanitizedPage,
                referrer: cleanReferrer,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                startedAt: existingStartedAt || ServerValue.TIMESTAMP,
                lastSeen: ServerValue.TIMESTAMP,
            })
            return { success: true, status: 200 }
        } catch (e) {
            console.warn('[PresenceService] RTDB write failed, falling back to Firestore:', e.message)
        }
    }

    // Driver 2: Distributed Cloud Firestore Presence
    if (adminDb) {
        try {
            const docRef = adminDb.collection(COLLECTION_NAME).doc(sessionId)
            const updatePayload = {
                sessionId,
                page: sanitizedPage,
                referrer: cleanReferrer,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                lastSeen: now,
                updatedAt: now,
            }

            try {
                // Try updating existing session first (preserves server-authoritative startedAt!)
                await docRef.update(updatePayload)
            } catch (updateErr) {
                // If document does not exist yet (code 5: NOT_FOUND), create it with server-side startedAt
                if (updateErr.code === 5 || updateErr.message?.includes('NOT_FOUND')) {
                    await docRef.set({
                        ...updatePayload,
                        startedAt: now, // Authoritative server-side creation timestamp
                        createdAt: now,
                    })
                } else {
                    throw updateErr
                }
            }

            return { success: true, status: 200 }
        } catch (e) {
            console.error('[PresenceService] Distributed Firestore write error:', e.message)
            return { success: false, error: 'Database write error', status: 500 }
        }
    }

    return { success: false, error: 'No database configured', status: 500 }
}

/**
 * Get current active visitors statistics for Admin Panel
 * Authoritatively queries the distributed database across all instances
 */
export async function getActiveVisitors() {
    const now = Date.now()
    const cutoff = now - ACTIVE_TIMEOUT_MS

    const activeList = []
    const deviceBreakdown = { Desktop: 0, Mobile: 0, Tablet: 0 }
    const browserBreakdown = {}
    const pageCounts = {}

    let totalDurationSeconds = 0

    const rtdb = await getRtdb()

    // 1. Read from Firebase Realtime Database if available
    if (rtdb) {
        try {
            const snap = await rtdb.ref('_live_presence')
                .orderByChild('lastSeen')
                .startAt(cutoff)
                .once('value')

            const val = snap.val() || {}
            for (const [sId, item] of Object.entries(val)) {
                if (!item || !item.lastSeen || item.lastSeen < cutoff) continue

                const sAt = item.startedAt || item.lastSeen
                const durationSec = Math.max(0, Math.floor((item.lastSeen - sAt) / 1000))
                totalDurationSeconds += durationSec

                deviceBreakdown[item.deviceType || 'Desktop'] = (deviceBreakdown[item.deviceType || 'Desktop'] || 0) + 1
                browserBreakdown[item.browser || 'Other'] = (browserBreakdown[item.browser || 'Other'] || 0) + 1
                pageCounts[item.page || '/'] = (pageCounts[item.page || '/'] || 0) + 1

                activeList.push({
                    sessionId: sId,
                    displayId: `Visitor #${sId.slice(-6)}`,
                    page: item.page || '/',
                    deviceType: item.deviceType || 'Desktop',
                    browser: item.browser || 'Other',
                    os: item.os || 'Other',
                    referrer: item.referrer || 'Direct',
                    startedAt: sAt,
                    lastSeen: item.lastSeen,
                    durationSeconds: durationSec,
                    secondsAgo: Math.max(0, Math.floor((now - item.lastSeen) / 1000)),
                })
            }
        } catch (e) {
            console.warn('[PresenceService] RTDB read failed, trying Firestore:', e.message)
        }
    }

    // 2. Read from Distributed Cloud Firestore Presence if activeList is empty
    if (activeList.length === 0 && adminDb) {
        try {
            const snap = await adminDb.collection(COLLECTION_NAME)
                .where('lastSeen', '>=', cutoff)
                .get()

            for (const doc of snap.docs) {
                const item = doc.data()
                if (!item || !item.lastSeen || item.lastSeen < cutoff) continue

                const sAt = item.startedAt || item.lastSeen
                const durationSec = Math.max(0, Math.floor((item.lastSeen - sAt) / 1000))
                totalDurationSeconds += durationSec

                deviceBreakdown[item.deviceType || 'Desktop'] = (deviceBreakdown[item.deviceType || 'Desktop'] || 0) + 1
                browserBreakdown[item.browser || 'Other'] = (browserBreakdown[item.browser || 'Other'] || 0) + 1
                pageCounts[item.page || '/'] = (pageCounts[item.page || '/'] || 0) + 1

                activeList.push({
                    sessionId: item.sessionId || doc.id,
                    displayId: `Visitor #${(item.sessionId || doc.id).slice(-6)}`,
                    page: item.page || '/',
                    deviceType: item.deviceType || 'Desktop',
                    browser: item.browser || 'Other',
                    os: item.os || 'Other',
                    referrer: item.referrer || 'Direct',
                    startedAt: sAt,
                    lastSeen: item.lastSeen,
                    durationSeconds: durationSec,
                    secondsAgo: Math.max(0, Math.floor((now - item.lastSeen) / 1000)),
                })
            }

            // Asynchronously trigger stale document cleanup without awaiting
            cleanStaleSessionsFromFirestore().catch(() => {})
        } catch (e) {
            console.error('[PresenceService] Distributed Firestore query error:', e.message)
        }
    }

    // Sort active visitors by most recently active first
    activeList.sort((a, b) => b.lastSeen - a.lastSeen)

    const topPages = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)

    const count = activeList.length
    const avgDuration = count > 0 ? Math.round(totalDurationSeconds / count) : 0

    return {
        count,
        visitors: activeList,
        deviceBreakdown,
        browserBreakdown,
        topPages,
        avgDurationSeconds: avgDuration,
        timestamp: now,
        timeoutWindowSeconds: Math.round(ACTIVE_TIMEOUT_MS / 1000),
    }
}
