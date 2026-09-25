/**
 * Duplicate Order Detector
 * 
 * Checks Firestore for recent orders that match the current order's
 * phone number + product combination within a configurable time window.
 * 
 * OPTIMIZED: All functions share a single cached orders snapshot per request
 * to avoid multiple full-collection reads.
 */

import { adminDb } from '../firebaseAdmin.js'
import { normalizePhone } from './phoneValidator.js'

function isFirebaseConfigured() {
    return Boolean(adminDb)
}

// Timeout helper — resolves with fallback if promise takes too long
function withTimeout(promise, ms, fallback) {
    let timer;
    return Promise.race([
        promise,
        new Promise(resolve => { timer = setTimeout(() => resolve(fallback), ms); })
    ]).finally(() => clearTimeout(timer));
}

// ── Shared orders cache per phone (60s TTL) ─────────────────────────
const _phoneOrdersCache = new Map()
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Add a newly created order directly to cache so subsequent checks are instant
 */
export function addOrderToCache(order) {
    if (!order) return
    const orderPhone = normalizePhone(order.address?.normalizedPhone || order.address?.phone || order.user?.phone || '')
    if (!orderPhone) return
    const cached = _phoneOrdersCache.get(orderPhone)
    if (cached && Array.isArray(cached.orders)) {
        if (!cached.orders.some(o => o.id === order.id)) {
            cached.orders.unshift(order)
        }
        cached.timestamp = Date.now()
    } else {
        _phoneOrdersCache.set(orderPhone, { orders: [order], timestamp: Date.now() })
    }
}

/** Clear or update the cache (call after order is saved) */
export function invalidateOrdersCache(newOrder = null) {
    if (newOrder) {
        addOrderToCache(newOrder)
    } else {
        _phoneOrdersCache.clear()
    }
}

/**
 * Fetch orders for a specific phone number (targeted indexed query instead of full collection scan).
 */
export async function getOrdersForPhone(phone) {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return []

    const now = Date.now()
    const cached = _phoneOrdersCache.get(normalizedPhone)
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
        return cached.orders
    }

    if (!adminDb) {
        return []
    }

    try {
        // Fast, targeted query with limit(15) to prevent unbounded scans
        const snap = await withTimeout(
            adminDb.collection('orders').where('address.normalizedPhone', '==', normalizedPhone).limit(15).get(),
            2500,
            null
        )

        const orderMap = new Map()
        if (snap && snap.docs && snap.docs.length > 0) {
            for (const d of snap.docs) {
                orderMap.set(d.id, { id: d.id, ...d.data() })
            }
        } else {
            // Fallback for legacy records stored with unnormalized phone
            const rawPhone = String(phone).trim()
            if (rawPhone && rawPhone !== normalizedPhone) {
                const fallbackSnap = await withTimeout(
                    adminDb.collection('orders').where('address.phone', '==', rawPhone).limit(15).get(),
                    2000,
                    null
                )
                if (fallbackSnap && fallbackSnap.docs) {
                    for (const d of fallbackSnap.docs) {
                        orderMap.set(d.id, { id: d.id, ...d.data() })
                    }
                }
            }
        }

        const orders = Array.from(orderMap.values())
        _phoneOrdersCache.set(normalizedPhone, { orders, timestamp: Date.now() })
        return orders
    } catch (error) {
        console.warn('[FraudDetector] Orders lookup notice:', error.message || error)
        return []
    }
}


/**
 * Run all fraud checks that need order history in ONE pass over the cached data.
 * This replaces 3-4 separate full-collection reads with a single read + in-memory filtering.
 * 
 * @param {object} params
 * @param {string} params.phone - Normalized phone
 * @param {string[]} params.productIds - Product IDs in the current order
 * @param {number} params.totalAmount - Order total
 * @param {number} [params.duplicateWindowMinutes=15]
 * @param {number} [params.rateWindowHours=1]
 * @param {number} [params.codDayWindowHours=24]
 * @returns {Promise<{ isDuplicate: boolean, matchedOrderId?: string, reason?: string, recentCount: number, codDayCount: number, history: { total: number, delivered: number, cancelled: number, pending: number } }>}
 */
export async function runAllOrderChecks({
    phone,
    productIds,
    totalAmount,
    duplicateWindowMinutes = 15,
    rateWindowHours = 1,
    codDayWindowHours = 24,
}) {
    const result = {
        isDuplicate: false,
        matchedOrderId: null,
        reason: null,
        recentCount: 0,
        codDayCount: 0,
        recentOrders: [],
        history: { total: 0, delivered: 0, cancelled: 0, pending: 0 },
    }

    if (!isFirebaseConfigured()) return result

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return result

    const customerOrders = await getOrdersForPhone(normalizedPhone)

    const now = Date.now()
    const duplicateCutoff = new Date(now - duplicateWindowMinutes * 60 * 1000).toISOString()
    const rateCutoff = new Date(now - rateWindowHours * 60 * 60 * 1000).toISOString()
    const codDayCutoff = new Date(now - codDayWindowHours * 60 * 60 * 1000).toISOString()

    const currentProductSet = new Set(productIds)

    for (const order of customerOrders) {
        const orderPhone = normalizePhone(order.address?.phone || order.address?.normalizedPhone || order.user?.phone || '')
        if (orderPhone !== normalizedPhone) continue

        const isCancelledOrRejected = order.status === 'CANCELLED' || order.status === 'FRAUD_REJECTED'

        // ── History stats (all time) ──
        result.history.total++
        if (order.status === 'DELIVERED') result.history.delivered++
        else if (isCancelledOrRejected) result.history.cancelled++
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

        // ── Duplicate check (only on active/non-cancelled orders in duplicate window) ──
        if (!isCancelledOrRejected && createdAt >= duplicateCutoff) {
            result.recentOrders.push(order)

            if (!result.isDuplicate) {
                const orderProductIds = (order.orderItems || order.items || [])
                    .map(item => item.productId || item.id || item.product?.id)
                    .filter(Boolean)
                const orderProductSet = new Set(orderProductIds)

                // Check product overlap
                const intersection = [...currentProductSet].filter(id => orderProductSet.has(id))
                const overlapRatio = currentProductSet.size > 0
                    ? intersection.length / currentProductSet.size
                    : 0

                // Duplicate requires actual product overlap (same products ordered in quick succession)
                if (overlapRatio >= 0.8 && currentProductSet.size > 0) {
                    result.isDuplicate = true
                    result.matchedOrderId = order.id
                    result.reason = 'SAME_PHONE_SAME_PRODUCTS'
                } else if (overlapRatio > 0 && typeof totalAmount === 'number' && totalAmount > 0 && Math.abs((order.total || 0) - totalAmount) < 1) {
                    result.isDuplicate = true
                    result.matchedOrderId = order.id
                    result.reason = 'SAME_PHONE_SAME_PRODUCTS_AND_AMOUNT'
                }
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
        const customerOrders = await getOrdersForPhone(normalizedPhone)
        const currentProductSet = new Set(productIds)

        for (const order of customerOrders) {
            if (excludeOrderId && order.id === excludeOrderId) continue
            if (!order.createdAt || order.createdAt < cutoffTime) continue
            if (order.status === 'CANCELLED' || order.status === 'FRAUD_REJECTED') continue

            const orderPhone = normalizePhone(order.address?.phone || order.address?.normalizedPhone || order.user?.phone || '')
            if (orderPhone !== normalizedPhone) continue

            const orderProductIds = (order.orderItems || order.items || [])
                .map(item => item.productId || item.id || item.product?.id)
                .filter(Boolean)
            const orderProductSet = new Set(orderProductIds)

            const intersection = [...currentProductSet].filter(id => orderProductSet.has(id))
            const overlapRatio = currentProductSet.size > 0
                ? intersection.length / currentProductSet.size
                : 0

            if (overlapRatio >= 0.8 && currentProductSet.size > 0) {
                return { isDuplicate: true, matchedOrderId: order.id, reason: 'SAME_PHONE_SAME_PRODUCTS' }
            }
            if (overlapRatio > 0 && Math.abs((order.total || 0) - totalAmount) < 1) {
                return { isDuplicate: true, matchedOrderId: order.id, reason: 'SAME_PHONE_SAME_PRODUCTS_AND_AMOUNT' }
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
        const customerOrders = await getOrdersForPhone(normalizedPhone)
        return customerOrders.filter(order => {
            if (!order.createdAt || order.createdAt < cutoffTime) return false
            const orderPhone = normalizePhone(order.address?.phone || order.address?.normalizedPhone || order.user?.phone || '')
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
        const customerOrders = await getOrdersForPhone(normalizedPhone)
        customerOrders.forEach(order => {
            const orderPhone = normalizePhone(order.address?.phone || order.address?.normalizedPhone || order.user?.phone || '')
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

/**
 * Legacy getCachedOrders export for backward compatibility
 */
export async function getCachedOrders() {
    return []
}

