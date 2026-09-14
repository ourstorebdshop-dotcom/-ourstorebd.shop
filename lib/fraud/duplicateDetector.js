/**
 * Duplicate Order Detector
 * 
 * Checks Firestore for recent orders that match the current order's
 * phone number + product combination within a configurable time window.
 * 
 * OPTIMIZED: All functions share a single cached orders snapshot per request
 * to avoid multiple full-collection reads.
 */

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { normalizePhone } from './phoneValidator.js'

// ── Shared orders cache (per-request, expires after 30s) ────────────
let _cachedOrders = null
let _cacheTimestamp = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

/**
 * Fetch all orders once and cache for the duration of this request cycle.
 * Subsequent calls within 30s reuse the same snapshot.
 */
async function getCachedOrders() {
    const now = Date.now()
    if (_cachedOrders && (now - _cacheTimestamp) < CACHE_TTL_MS) {
        return _cachedOrders
    }

    if (!isFirebaseConfigured()) {
        _cachedOrders = []
        _cacheTimestamp = now
        return _cachedOrders
    }

    try {
        const snap = await getDocs(collection(db, 'orders'))
        _cachedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        _cacheTimestamp = now
        return _cachedOrders
    } catch (error) {
        console.error('[FraudDetector] Failed to fetch orders:', error)
        _cachedOrders = []
        _cacheTimestamp = now
        return _cachedOrders
    }
}

/** Clear the cache (call after order is saved to ensure fresh data next time) */
export function invalidateOrdersCache() {
    _cachedOrders = null
    _cacheTimestamp = 0
}

/**
 * Run all fraud checks that need order history in ONE pass over the cached data.
 * This replaces 3-4 separate full-collection reads with a single read + in-memory filtering.
 * 
 * @param {object} params
 * @param {string} params.phone - Normalized phone
 * @param {string[]} params.productIds - Product IDs in the current order
 * @param {number} params.totalAmount - Order total
 * @param {number} [params.duplicateWindowMinutes=30]
 * @param {number} [params.rateWindowHours=1]
 * @param {number} [params.codDayWindowHours=24]
 * @returns {Promise<{ isDuplicate: boolean, matchedOrderId?: string, reason?: string, recentCount: number, codDayCount: number, history: { total: number, delivered: number, cancelled: number, pending: number } }>}
 */
export async function runAllOrderChecks({
    phone,
    productIds,
    totalAmount,
    duplicateWindowMinutes = 30,
    rateWindowHours = 1,
    codDayWindowHours = 24,
}) {
    const result = {
        isDuplicate: false,
        matchedOrderId: null,
        reason: null,
        recentCount: 0,
        codDayCount: 0,
        history: { total: 0, delivered: 0, cancelled: 0, pending: 0 },
    }

    if (!isFirebaseConfigured()) return result

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return result

    const allOrders = await getCachedOrders()

    const now = Date.now()
    const duplicateCutoff = new Date(now - duplicateWindowMinutes * 60 * 1000).toISOString()
    const rateCutoff = new Date(now - rateWindowHours * 60 * 60 * 1000).toISOString()
    const codDayCutoff = new Date(now - codDayWindowHours * 60 * 60 * 1000).toISOString()

    const currentProductSet = new Set(productIds)

    for (const order of allOrders) {
        const orderPhone = normalizePhone(order.address?.phone || order.user?.phone || '')
        if (orderPhone !== normalizedPhone) continue

        // ── History stats (all time) ──
        result.history.total++
        if (order.status === 'DELIVERED') result.history.delivered++
        else if (order.status === 'CANCELLED' || order.status === 'FRAUD_REJECTED') result.history.cancelled++
        else result.history.pending++

        const createdAt = order.createdAt || ''

        // ── Rate limiting (1 hour window) ──
        if (createdAt >= rateCutoff) {
            result.recentCount++
        }

        // ── COD day count (24 hour window) ──
        if (createdAt >= codDayCutoff) {
            result.codDayCount++
        }

        // ── Duplicate check (30 min window) ──
        if (!result.isDuplicate && createdAt >= duplicateCutoff) {
            const orderProductIds = (order.orderItems || [])
                .map(item => item.productId || item.product?.id)
                .filter(Boolean)
            const orderProductSet = new Set(orderProductIds)

            // Check product overlap
            const intersection = [...currentProductSet].filter(id => orderProductSet.has(id))
            const overlapRatio = currentProductSet.size > 0
                ? intersection.length / currentProductSet.size
                : 0

            if (overlapRatio >= 0.8) {
                result.isDuplicate = true
                result.matchedOrderId = order.id
                result.reason = 'SAME_PHONE_SAME_PRODUCTS'
            } else if (Math.abs((order.total || 0) - totalAmount) < 1) {
                result.isDuplicate = true
                result.matchedOrderId = order.id
                result.reason = 'SAME_PHONE_SAME_AMOUNT'
            }
        }
    }

    return result
}

// ── Legacy exports (kept for backward compatibility) ────────────────

/**
 * @deprecated Use runAllOrderChecks() instead for better performance.
 */
export async function checkDuplicateOrder({
    phone,
    productIds,
    address,
    totalAmount,
    windowMinutes = 30,
    excludeOrderId = null,
}) {
    if (!isFirebaseConfigured()) return { isDuplicate: false }

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return { isDuplicate: false }

    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

    try {
        const allOrders = await getCachedOrders()
        const currentProductSet = new Set(productIds)

        for (const order of allOrders) {
            if (excludeOrderId && order.id === excludeOrderId) continue
            if (!order.createdAt || order.createdAt < cutoffTime) continue

            const orderPhone = normalizePhone(order.address?.phone || order.user?.phone || '')
            if (orderPhone !== normalizedPhone) continue

            const orderProductIds = (order.orderItems || [])
                .map(item => item.productId || item.product?.id)
                .filter(Boolean)
            const orderProductSet = new Set(orderProductIds)

            const intersection = [...currentProductSet].filter(id => orderProductSet.has(id))
            const overlapRatio = currentProductSet.size > 0
                ? intersection.length / currentProductSet.size
                : 0

            if (overlapRatio >= 0.8) {
                return { isDuplicate: true, matchedOrderId: order.id, reason: 'SAME_PHONE_SAME_PRODUCTS' }
            }
            if (Math.abs((order.total || 0) - totalAmount) < 1) {
                return { isDuplicate: true, matchedOrderId: order.id, reason: 'SAME_PHONE_SAME_AMOUNT' }
            }
        }

        return { isDuplicate: false }
    } catch (error) {
        console.error('[FraudDetector] Duplicate check error:', error)
        return { isDuplicate: false }
    }
}

/**
 * @deprecated Use runAllOrderChecks() instead for better performance.
 */
export async function countRecentOrdersByPhone(phone, windowHours = 1) {
    if (!isFirebaseConfigured()) return 0

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return 0

    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    try {
        const allOrders = await getCachedOrders()
        return allOrders.filter(order => {
            if (!order.createdAt || order.createdAt < cutoffTime) return false
            const orderPhone = normalizePhone(order.address?.phone || order.user?.phone || '')
            return orderPhone === normalizedPhone
        }).length
    } catch {
        return 0
    }
}

/**
 * @deprecated Use runAllOrderChecks() instead for better performance.
 */
export async function getPhoneOrderHistory(phone) {
    const stats = { total: 0, delivered: 0, cancelled: 0, pending: 0 }
    if (!isFirebaseConfigured()) return stats

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return stats

    try {
        const allOrders = await getCachedOrders()
        allOrders.forEach(order => {
            const orderPhone = normalizePhone(order.address?.phone || order.user?.phone || '')
            if (orderPhone !== normalizedPhone) return

            stats.total++
            if (order.status === 'DELIVERED') stats.delivered++
            else if (order.status === 'CANCELLED' || order.status === 'FRAUD_REJECTED') stats.cancelled++
            else stats.pending++
        })

        return stats
    } catch {
        return stats
    }
}
