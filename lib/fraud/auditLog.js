/**
 * Fraud Audit Logger
 * 
 * Writes fraud-related events to Firestore `fraud_audit_log` collection.
 * Used for admin review and historical analysis.
 * 
 * NEVER logs: passwords, OTP values, payment credentials, or sensitive secrets.
 */

import { collection, addDoc, getDocs, query, orderBy, limit as fbLimit, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firestore'
import { FRAUD_DEFAULTS } from './config'

/**
 * Log a fraud event.
 * 
 * @param {object} event
 * @param {string} event.type - Event type: ORDER_ATTEMPT | ORDER_BLOCKED | DUPLICATE_DETECTED | 
 *                              RATE_LIMITED | PHONE_BLOCKED | PHONE_UNBLOCKED | ADMIN_ACTION | BOT_DETECTED
 * @param {string} [event.orderId] - Related order ID
 * @param {string} [event.phone] - Normalized phone (partial — last 4 digits only for privacy)
 * @param {string} [event.ip] - Client IP (partial for privacy)
 * @param {number} [event.riskScore] - Calculated risk score
 * @param {string} [event.riskLevel] - LOW | MEDIUM | HIGH
 * @param {string} [event.reason] - Human-readable reason
 * @param {object} [event.metadata] - Additional non-sensitive data
 */
export async function logFraudEvent(event) {
    if (!isFirebaseConfigured()) return

    try {
        const logEntry = {
            type: event.type || 'UNKNOWN',
            timestamp: new Date().toISOString(),
            orderId: event.orderId || null,
            phone: event.phone ? maskPhone(event.phone) : null,
            ip: event.ip ? maskIP(event.ip) : null,
            riskScore: event.riskScore ?? null,
            riskLevel: event.riskLevel || null,
            reason: event.reason || null,
            metadata: event.metadata || null,
        }

        await addDoc(collection(db, 'fraud_audit_log'), logEntry)
    } catch (error) {
        // Don't let logging failures break the order flow
        console.error('[AuditLog] Failed to log fraud event:', error)
    }
}

/**
 * Get recent fraud audit log entries.
 * @param {number} maxEntries
 * @returns {Promise<Array>}
 */
export async function getRecentAuditLogs(maxEntries = 50) {
    if (!isFirebaseConfigured()) return []

    try {
        const logsRef = collection(db, 'fraud_audit_log')
        const snap = await getDocs(logsRef)
        
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .slice(0, maxEntries)
    } catch (error) {
        console.error('[AuditLog] Failed to read audit logs:', error)
        return []
    }
}

/**
 * Mask phone number for privacy in logs.
 * "01712345678" → "0171****678"
 */
function maskPhone(phone) {
    if (!phone || phone.length < 6) return '****'
    return phone.slice(0, 4) + '****' + phone.slice(-3)
}

/**
 * Mask IP address for privacy in logs.
 * "192.168.1.100" → "192.168.x.x"
 */
function maskIP(ip) {
    if (!ip) return null
    const parts = ip.split('.')
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.x.x`
    }
    // IPv6 or other — just truncate
    return ip.slice(0, 10) + '...'
}
