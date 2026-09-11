/**
 * Fraud Prevention Configuration
 * Single source of truth for all fraud detection thresholds.
 * Admin can override these via the fraud settings UI (stored in Redux/Firestore).
 */

export const FRAUD_DEFAULTS = {
    // Rate Limiting
    maxOrdersPerPhonePerHour: 3,
    maxOrdersPerIPPerHour: 5,
    maxFailedAttemptsPerIPPerHour: 10,

    // Duplicate Order Detection
    duplicateOrderWindowMinutes: 30,

    // Bot Detection
    minOrderSubmissionTimeMs: 3000, // Orders placed faster than this are suspicious

    // Risk Score Thresholds (0-100)
    riskThresholds: {
        low: 30,      // 0-30: normal checkout
        medium: 60,   // 31-60: admin review
        // 61+: high risk — block or require verification
    },

    // COD Protection
    codRiskMultiplier: 1.5,
    maxCODOrdersPerPhonePerDay: 2,

    // Risk Score Weights
    riskWeights: {
        rapidOrders: 25,              // Multiple orders in short window
        duplicateOrder: 40,           // Near-identical recent order
        invalidPhone: 50,             // Malformed phone number
        blockedPhone: 100,            // On blocklist
        blockedIP: 100,               // On blocklist
        noOrderHistory: 10,           // First-time customer (mild signal)
        highCancelRate: 20,           // Many cancelled orders
        codNoHistory: 15,             // COD with no successful orders
        suspiciousAddress: 15,        // Address anomalies
        botDetected: 60,              // Form submitted too fast / honeypot filled
        rateLimitExceeded: 80,        // Hit rate limit
    },

    // Audit Log
    maxAuditLogEntries: 500, // Per collection, auto-cleanup
}

/**
 * Merge admin-configured overrides with defaults.
 * @param {object|null} adminOverrides - From Redux/Firestore fraud settings
 * @returns {object} Merged config
 */
export function getFraudConfig(adminOverrides = null) {
    if (!adminOverrides) return { ...FRAUD_DEFAULTS }
    return {
        ...FRAUD_DEFAULTS,
        ...adminOverrides,
        riskThresholds: {
            ...FRAUD_DEFAULTS.riskThresholds,
            ...(adminOverrides.riskThresholds || {}),
        },
        riskWeights: {
            ...FRAUD_DEFAULTS.riskWeights,
            ...(adminOverrides.riskWeights || {}),
        },
    }
}
