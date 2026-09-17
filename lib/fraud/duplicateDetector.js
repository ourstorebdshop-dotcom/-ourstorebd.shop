/**
 * Duplicate Order Detector
 * 
 * Checks Firestore for recent orders that match the current order's
 * phone number + product combination within a configurable time window.
 * 
 * OPTIMIZED: All functions share a single cached orders snapshot per request
 * to avoid multiple full-collection reads.
 */

import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { normalizePhone } from './phoneValidator.js'

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

    if (!isFirebaseConfigured()) {
        return []
    }

    try {
        const ordersRef = collection(db, 'orders')
        const qNormalized = query(ordersRef, where('address.normalizedPhone', '==', normalizedPhone))

        const rawPhone = String(phone).trim()
        const queries = [getDocs(qNormalized)]
        if (rawPhone && rawPhone !== normalizedPhone) {
            queries.push(getDocs(query(ordersRef, where('address.phone', '==', rawPhone))).catch(() => null))
        }

        const snapshots = await withTimeout(Promise.all(queries), 5000, [])
        const orderMap = new Map()

        for (const snap of snapshots) {
            if (snap && snap.docs) {
                for (const d of snap.docs) {
                    if (!orderMap.has(d.id)) {
                        orderMap.set(d.id, { id: d.id, ...d.data() })
                    }
                }
            }
        }

        const orders = Array.from(orderMap.values())
        _phoneOrdersCache.set(normalizedPhone, { orders, timestamp: Date.now() })
        return orders
    } catch (error) {
        console.error('[FraudDetector] Failed to fetch orders for phone:', error)
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
        if (createdAt >= duplicateCutoff) {
            result.recentOrders.push(order)

            if (!result.isDuplicate) {
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
                } else if (typeof totalAmount === 'number' && totalAmount > 0 && Math.abs((order.total || 0) - totalAmount) < 1) {
                    result.isDuplicate = true
                    result.matchedOrderId = order.id
                    result.reason = 'SAME_PHONE_SAME_AMOUNT'
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

            const orderPhone = normalizePhone(order.address?.phone || order.address?.normalizedPhone || order.user?.phone || '')
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

