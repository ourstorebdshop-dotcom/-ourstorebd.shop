/**
 * Order Integrations Sync Engine (Production-Hardened)
 * 
 * Features:
 * 1. Independent Status Tracking:
 *    - telegram: SUCCESS | FAILED | PENDING | SKIPPED
 *    - googleSheets: SUCCESS | FAILED | PENDING | SKIPPED
 * 2. Automatic Retry Loop with Exponential Backoff for transient network hiccups
 * 3. In-Flight Concurrency Lock (prevents race-condition double syncing)
 * 4. Bulk Retry mechanism (retryAllFailed)
 * 5. Safe Firestore persistence for settings, audit logs & order metadata
 */

import { collection, doc, getDoc, getDocs, updateDoc, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase.js'
import { isFirebaseConfigured, saveDocToFirestore } from '../firestore.js'
import { sendTelegramOrderNotification } from './telegram.js'
import { syncOrderToGoogleSheets } from './googleSheets.js'
import { defaultIntegrationsSettings } from '../features/integrations/integrationsSlice.js'

// In-memory concurrency lock (prevents double syncing the same order concurrently)
const inFlightSyncs = new Set()

const MAX_AUTO_RETRIES = 2
const INITIAL_BACKOFF_MS = 1000

/**
 * Utility for exponential backoff delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Load integrations settings from Firestore (with fallbacks)
 */
export async function getStoredIntegrationsSettings() {
    if (!isFirebaseConfigured()) return defaultIntegrationsSettings
    try {
        const snap = await getDoc(doc(db, 'settings', 'integrations'))
        if (snap.exists()) {
            const data = snap.data()
            return {
                ...defaultIntegrationsSettings,
                ...data,
                telegram: { ...defaultIntegrationsSettings.telegram, ...(data.telegram || {}) },
                googleSheets: { ...defaultIntegrationsSettings.googleSheets, ...(data.googleSheets || {}) },
                syncStats: { ...defaultIntegrationsSettings.syncStats, ...(data.syncStats || {}) },
                syncLogs: Array.isArray(data.syncLogs) ? data.syncLogs : [],
            }
        }
    } catch (err) {
        console.warn('[SyncEngine] Failed to read integrations settings from Firestore:', err)
    }
    return defaultIntegrationsSettings
}

/**
 * Append a sync log entry to Firestore settings/integrations
 */
export async function recordSyncEvent(logEntry, currentSettings) {
    if (!isFirebaseConfigured()) return

    try {
        const settings = currentSettings || await getStoredIntegrationsSettings()
        const logs = [logEntry, ...(settings.syncLogs || [])].slice(0, 100) // keep last 100 logs
        const stats = { ...settings.syncStats }

        if (logEntry.status === 'SUCCESS') {
            stats.totalOrdersSynced = (stats.totalOrdersSynced || 0) + 1
            if (logEntry.service === 'telegram') stats.telegramSuccessCount = (stats.telegramSuccessCount || 0) + 1
            if (logEntry.service === 'google_sheets') stats.googleSheetsSuccessCount = (stats.googleSheetsSuccessCount || 0) + 1
            stats.lastSyncTime = logEntry.timestamp
            stats.lastSyncStatus = 'SUCCESS'
        } else if (logEntry.status === 'FAILED') {
            stats.failedCount = (stats.failedCount || 0) + 1
            stats.lastSyncTime = logEntry.timestamp
            stats.lastSyncStatus = 'FAILED'
            stats.lastError = logEntry.error || 'Sync failed'
        }

        await saveDocToFirestore('settings', 'integrations', {
            ...settings,
            syncStats: stats,
            syncLogs: logs,
        })
    } catch (e) {
        console.warn('[SyncEngine] Failed to append sync log to Firestore:', e)
    }
}

/**
 * Execute a single service with exponential backoff retries
 */
async function executeWithRetry(fn, serviceName, maxRetries = MAX_AUTO_RETRIES) {
    let attempt = 0
    let lastResult = null

    while (attempt <= maxRetries) {
        try {
            lastResult = await fn()
            // If success or intentionally skipped (e.g. disabled or already sent), don't retry
            if (lastResult.success || lastResult.skipped) {
                return { ...lastResult, attemptsNeeded: attempt + 1 }
            }

            // If 401 Unauthorized or 403 Forbidden, don't waste time retrying with wrong token
            if (lastResult.errorCode === 401 || lastResult.errorCode === 403 || lastResult.code === 'UNAUTHORIZED') {
                return { ...lastResult, attemptsNeeded: attempt + 1 }
            }
        } catch (err) {
            lastResult = { success: false, error: err.message }
        }

        attempt += 1
        if (attempt <= maxRetries) {
            const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
            await sleep(backoffMs)
        }
    }

    return { ...lastResult, attemptsNeeded: attempt }
}

/**
 * Main Order Sync Function — called in background after order is created
 * 
 * @param {Object} order - Full order object
 * @param {string} origin - Origin URL (e.g. 'https://ourstorebd.shop')
 * @param {Object} [overrideSettings] - Optional settings override
 * @param {Object} [options] - Flags ({ force: boolean })
 */
export async function syncOrderIntegrations(order, origin = '', overrideSettings = null, options = {}) {
    if (!order || !order.id) {
        return { success: false, reason: 'Invalid order object' }
    }

    const orderId = String(order.id).trim()

    // Concurrency Lock: Prevent multiple identical sync runs on the same order simultaneously
    if (inFlightSyncs.has(orderId)) {
        return { success: true, skipped: true, reason: `Sync for order #${orderId} is already in-flight` }
    }
    inFlightSyncs.add(orderId)

    try {
        const settings = overrideSettings || await getStoredIntegrationsSettings()
        const results = {
            orderId,
            telegram: null,
            googleSheets: null,
        }

        const tasks = []

        // ── 1. Telegram Service ─────────────────────────────────────────
        if (settings.telegram?.enabled && settings.telegram?.botToken && settings.telegram?.chatId) {
            tasks.push(
                executeWithRetry(
                    () => sendTelegramOrderNotification(order, settings.telegram, origin, options),
                    'telegram'
                ).then(res => {
                    results.telegram = { service: 'telegram', ...res }
                    return results.telegram
                })
            )
        } else {
            results.telegram = {
                service: 'telegram',
                status: 'SKIPPED',
                skipped: true,
                reason: 'Telegram integration is disabled or unconfigured.',
            }
        }

        // ── 2. Google Sheets Service ────────────────────────────────────
        if (settings.googleSheets?.enabled && settings.googleSheets?.webhookUrl) {
            tasks.push(
                executeWithRetry(
                    () => syncOrderToGoogleSheets(order, settings.googleSheets, options),
                    'google_sheets'
                ).then(res => {
                    results.googleSheets = { service: 'google_sheets', ...res }
                    return results.googleSheets
                })
            )
        } else {
            results.googleSheets = {
                service: 'google_sheets',
                status: 'SKIPPED',
                skipped: true,
                reason: 'Google Sheets integration is disabled or Webhook URL missing.',
            }
        }

        // Execute both integrations in parallel
        if (tasks.length > 0) {
            await Promise.allSettled(tasks)
        }

        // ── 3. Parse and Map Statuses ───────────────────────────────────
        const telegramStatus = results.telegram?.success
            ? 'SUCCESS'
            : results.telegram?.skipped
            ? 'SKIPPED'
            : 'FAILED'

        const sheetsStatus = results.googleSheets?.success
            ? 'SUCCESS'
            : results.googleSheets?.skipped
            ? 'SKIPPED'
            : 'FAILED'

        // Record audit logs for active runs
        const now = new Date().toISOString()
        const customerName = order.address?.name || order.user?.name || order.deliveryInfo?.name || 'Customer'
        const total = order.total || order.amount || 0

        if (results.telegram && !results.telegram.skipped) {
            recordSyncEvent({
                id: `log_tg_${orderId}_${Date.now()}`,
                orderId,
                service: 'telegram',
                status: telegramStatus,
                error: results.telegram.error || null,
                timestamp: now,
                customerName,
                total,
            }, settings).catch(() => {})
        }

        if (results.googleSheets && !results.googleSheets.skipped) {
            recordSyncEvent({
                id: `log_gs_${orderId}_${Date.now()}`,
                orderId,
                service: 'google_sheets',
                status: sheetsStatus,
                action: results.googleSheets.action,
                row: results.googleSheets.row,
                error: results.googleSheets.error || null,
                timestamp: now,
                customerName,
                total,
            }, settings).catch(() => {})
        }

        // ── 4. Safely Annotate Order Document in Firestore ──────────────
        if (isFirebaseConfigured()) {
            try {
                await updateDoc(doc(db, 'orders', orderId), {
                    _integrations: {
                        telegram: {
                            status: telegramStatus,
                            messageId: results.telegram?.messageId || null,
                            error: results.telegram?.error || null,
                            lastAttemptAt: now,
                        },
                        googleSheets: {
                            status: sheetsStatus,
                            row: results.googleSheets?.row || null,
                            action: results.googleSheets?.action || null,
                            error: results.googleSheets?.error || null,
                            lastAttemptAt: now,
                        },
                        syncedAt: now,
                    }
                })
            } catch (e) {
                // Non-fatal: order data itself remains fully intact
            }
        }

        return {
            success: telegramStatus !== 'FAILED' && sheetsStatus !== 'FAILED',
            results: {
                orderId,
                telegram: { status: telegramStatus, ...results.telegram },
                googleSheets: { status: sheetsStatus, ...results.googleSheets },
            },
        }

    } finally {
        inFlightSyncs.delete(orderId)
    }
}

/**
 * Retry or manually sync a specific order by ID
 */
export async function retryOrderSync(orderId, service = 'all', origin = '') {
    if (!orderId) return { success: false, error: 'Order ID is required' }

    try {
        let order = null
        if (isFirebaseConfigured()) {
            const snap = await getDoc(doc(db, 'orders', String(orderId)))
            if (snap.exists()) {
                order = { id: snap.id, ...snap.data() }
            }
        }

        if (!order) {
            return { success: false, error: `অর্ডার #${orderId} ডাটাবেজে পাওয়া যায়নি।` }
        }

        const settings = await getStoredIntegrationsSettings()
        const customSettings = {
            ...settings,
            telegram: {
                ...settings.telegram,
                enabled: (service === 'all' || service === 'telegram') ? settings.telegram.enabled : false,
            },
            googleSheets: {
                ...settings.googleSheets,
                enabled: (service === 'all' || service === 'google_sheets') ? settings.googleSheets.enabled : false,
            },
        }

        // Force retry flag to bypass duplicate protection
        const res = await syncOrderIntegrations(order, origin, customSettings, { force: true })
        return {
            success: res.success,
            orderId,
            results: res.results,
        }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

/**
 * Bulk Retry all orders that currently have FAILED integration status
 */
export async function retryAllFailedOrders(origin = '') {
    if (!isFirebaseConfigured()) {
        return { success: false, error: 'Firebase is not configured' }
    }

    try {
        const ordersRef = collection(db, 'orders')
        const snap = await getDocs(ordersRef)
        const failedOrders = []

        snap.forEach(docSnap => {
            const data = docSnap.data()
            const intg = data._integrations
            if (
                intg &&
                (intg.telegram?.status === 'FAILED' || intg.googleSheets?.status === 'FAILED')
            ) {
                failedOrders.push({ id: docSnap.id, ...data })
            }
        })

        if (failedOrders.length === 0) {
            return {
                success: true,
                message: 'কোনো ব্যর্থ (Failed) অর্ডার পাওয়া যায়নি। সকল অর্ডার আপ-টু-ডেট আছে!',
                retriedCount: 0,
            }
        }

        // Process sequentially with slight gap to respect rate limits
        let successCount = 0
        const details = []

        for (const order of failedOrders.slice(0, 20)) { // limit batch to 20 at a time
            const res = await syncOrderIntegrations(order, origin, null, { force: true })
            if (res.success) successCount += 1
            details.push({ orderId: order.id, success: res.success })
            await sleep(300)
        }

        return {
            success: true,
            totalFound: failedOrders.length,
            retriedCount: details.length,
            successCount,
            details,
        }
    } catch (err) {
        return { success: false, error: err.message }
    }
}
