/**
 * Risk Scorer
 * 
 * Calculates a fraud risk score (0-100) from multiple signals.
 * Higher score = more suspicious.
 */

import { FRAUD_DEFAULTS } from './config'

/**
 * Calculate fraud risk score for an order attempt.
 * 
 * @param {object} signals - Object with boolean/numeric fraud signals
 * @param {boolean} [signals.invalidPhone] - Phone failed validation
 * @param {boolean} [signals.blockedPhone] - Phone is on blocklist
 * @param {boolean} [signals.blockedIP] - IP is on blocklist
 * @param {boolean} [signals.botDetected] - Honeypot filled or too-fast submission
 * @param {boolean} [signals.rateLimitExceeded] - Rate limit hit
 * @param {boolean} [signals.duplicateOrder] - Near-duplicate detected
 * @param {boolean} [signals.rapidOrders] - Multiple orders in short window
 * @param {boolean} [signals.noOrderHistory] - First-time customer
 * @param {boolean} [signals.highCancelRate] - Many cancellations
 * @param {boolean} [signals.codNoHistory] - COD with no prior deliveries
 * @param {boolean} [signals.suspiciousAddress] - Address anomaly
 * @param {boolean} [signals.isCOD] - Cash on Delivery order
 * @param {object} [config] - Fraud config overrides
 * @returns {{ score: number, level: 'LOW'|'MEDIUM'|'HIGH', reasons: string[] }}
 */
export function calculateRiskScore(signals = {}, config = null) {
    const weights = config?.riskWeights || FRAUD_DEFAULTS.riskWeights
    const thresholds = config?.riskThresholds || FRAUD_DEFAULTS.riskThresholds
    const codMultiplier = config?.codRiskMultiplier || FRAUD_DEFAULTS.codRiskMultiplier

    let score = 0
    const reasons = []

    // Evaluate each signal
    if (signals.invalidPhone) {
        score += weights.invalidPhone
        reasons.push('অবৈধ ফোন নম্বর')
    }
    if (signals.blockedPhone) {
        score += weights.blockedPhone
        reasons.push('ব্লকলিস্টে থাকা ফোন নম্বর')
    }
    if (signals.blockedIP) {
        score += weights.blockedIP
        reasons.push('ব্লকলিস্টে থাকা IP')
    }
    if (signals.botDetected) {
        score += weights.botDetected
        reasons.push('বট/অটোমেটেড অর্ডার সনাক্ত')
    }
    if (signals.rateLimitExceeded) {
        score += weights.rateLimitExceeded
        reasons.push('অত্যধিক অর্ডার প্রচেষ্টা')
    }
    if (signals.duplicateOrder) {
        score += weights.duplicateOrder
        reasons.push('ডুপ্লিকেট অর্ডার')
    }
    if (signals.rapidOrders) {
        score += weights.rapidOrders
        reasons.push('অল্প সময়ে একাধিক অর্ডার')
    }
    if (signals.noOrderHistory) {
        score += weights.noOrderHistory
        reasons.push('নতুন কাস্টমার (কোনো অর্ডার ইতিহাস নেই)')
    }
    if (signals.highCancelRate) {
        score += weights.highCancelRate
        reasons.push('উচ্চ বাতিল হার')
    }
    if (signals.codNoHistory) {
        score += weights.codNoHistory
        reasons.push('COD অর্ডার — কোনো সফল ডেলিভারি ইতিহাস নেই')
    }
    if (signals.suspiciousAddress) {
        score += weights.suspiciousAddress
        reasons.push('সন্দেহজনক ঠিকানা')
    }

    // Apply COD multiplier
    if (signals.isCOD && score > 0) {
        score = Math.round(score * codMultiplier)
        reasons.push('COD অর্ডার — ঝুঁকি বৃদ্ধি')
    }

    // Cap at 100
    score = Math.min(score, 100)

    // Determine level
    let level = 'LOW'
    if (score > thresholds.medium) {
        level = 'HIGH'
    } else if (score > thresholds.low) {
        level = 'MEDIUM'
    }

    return { score, level, reasons }
}

/**
 * Get a human-readable label for a risk level.
 */
export function getRiskLabel(level) {
    switch (level) {
        case 'HIGH': return 'উচ্চ ঝুঁকি'
        case 'MEDIUM': return 'মাঝারি ঝুঁকি'
        case 'LOW': return 'কম ঝুঁকি'
        default: return level
    }
}

/**
 * Get badge color classes for a risk level (Tailwind).
 */
export function getRiskBadgeClasses(level) {
    switch (level) {
        case 'HIGH': return 'bg-red-100 text-red-700 border-red-200'
        case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200'
        case 'LOW': return 'bg-green-100 text-green-700 border-green-200'
        default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
}
