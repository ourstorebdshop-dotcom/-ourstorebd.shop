/**
 * Duplicate Order Detector
 * 
 * Checks Firestore for recent orders that match the current order's
 * phone number + product combination within a configurable time window.
 */

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { normalizePhone } from './phoneValidator'

/**
 * Check if a similar order was recently placed.
 * 
 * @param {object} params
 * @param {string} params.phone - Customer phone number
 * @param {string[]} params.productIds - Array of product IDs in the order
 * @param {string} params.address - Delivery address
 * @param {number} params.totalAmount - Order total
 * @param {number} params.windowMinutes - How far back to check (default: 30)
 * @param {string} [params.excludeOrderId] - Order ID to exclude (for idempotency)
 * @returns {Promise<{ isDuplicate: boolean, matchedOrderId?: string, reason?: string }>}
 */
export async function checkDuplicateOrder({
    phone,
    productIds,
    address,
    totalAmount,
    windowMinutes = 30,
    excludeOrderId = null,
}) {
    if (!isFirebaseConfigured()) {
        // Fallback: can't check, assume not duplicate
        return { isDuplicate: false }
    }

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return { isDuplicate: false }

    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

    try {
        // Query recent orders from Firestore
        // Note: Firestore requires composite indexes for complex queries.
        // We'll query by normalized phone and filter client-side for simplicity.
        const ordersRef = collection(db, 'orders')
        
        // Simple query — get recent orders and filter in memory
        // (Firestore free tier friendly — avoids complex composite indexes)
        const snap = await getDocs(ordersRef)
        
        if (snap.empty) return { isDuplicate: false }

        const recentOrders = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(order => {
                if (excludeOrderId && order.id === excludeOrderId) return false
                if (!order.createdAt || order.createdAt < cutoffTime) return false
                
                // Check phone match
                const orderPhone = normalizePhone(
                    order.address?.phone || order.user?.phone || ''
                )
                return orderPhone === normalizedPhone
            })

        if (recentOrders.length === 0) return { isDuplicate: false }

        // Check for product overlap
        const currentProductSet = new Set(productIds)
        
        for (const order of recentOrders) {
            const orderProductIds = (order.orderItems || []).map(
                item => item.productId || item.product?.id
            ).filter(Boolean)

            const orderProductSet = new Set(orderProductIds)
            
            // Check if product sets overlap significantly
            const intersection = [...currentProductSet].filter(id => orderProductSet.has(id))
            const overlapRatio = currentProductSet.size > 0 
                ? intersection.length / currentProductSet.size 
                : 0

            // Exact same products
            if (overlapRatio >= 0.8) {
                return {
                    isDuplicate: true,
                    matchedOrderId: order.id,
                    reason: 'SAME_PHONE_SAME_PRODUCTS',
                }
            }

            // Same phone + same total amount (different products but suspicious)
            if (Math.abs((order.total || 0) - totalAmount) < 1) {
                return {
                    isDuplicate: true,
                    matchedOrderId: order.id,
                    reason: 'SAME_PHONE_SAME_AMOUNT',
                }
            }
        }

        return { isDuplicate: false }
    } catch (error) {
        console.error('[FraudDetector] Duplicate check error:', error)
        // Don't block orders on check failure
        return { isDuplicate: false }
    }
}

/**
 * Count recent orders for a given phone number.
 * Used for rate limiting and risk scoring.
 * 
 * @param {string} phone
 * @param {number} windowHours - How far back to check
 * @returns {Promise<number>}
 */
export async function countRecentOrdersByPhone(phone, windowHours = 1) {
    if (!isFirebaseConfigured()) return 0

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return 0

    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    try {
        const ordersRef = collection(db, 'orders')
        const snap = await getDocs(ordersRef)
        
        return snap.docs
            .map(d => d.data())
            .filter(order => {
                if (!order.createdAt || order.createdAt < cutoffTime) return false
                const orderPhone = normalizePhone(
                    order.address?.phone || order.user?.phone || ''
                )
                return orderPhone === normalizedPhone
            }).length
    } catch {
        return 0
    }
}

/**
 * Get order history stats for a phone number.
 * @param {string} phone
 * @returns {Promise<{ total: number, delivered: number, cancelled: number, pending: number }>}
 */
export async function getPhoneOrderHistory(phone) {
    const stats = { total: 0, delivered: 0, cancelled: 0, pending: 0 }
    if (!isFirebaseConfigured()) return stats

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return stats

    try {
        const ordersRef = collection(db, 'orders')
        const snap = await getDocs(ordersRef)
        
        snap.docs.forEach(d => {
            const order = d.data()
            const orderPhone = normalizePhone(
                order.address?.phone || order.user?.phone || ''
            )
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
