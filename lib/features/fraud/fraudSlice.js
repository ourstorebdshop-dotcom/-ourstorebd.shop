import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    // Blocklists
    blockedPhones: [],    // ['01712345678', ...]
    blockedIPs: [],       // ['1.2.3.4', ...]
    
    // Watchlist (monitored but not blocked)
    watchlist: [],        // [{ phone, reason, addedAt }, ...]
    
    // Trusted customers (bypass extra checks)
    trustedPhones: [],    // ['01712345678', ...]

    // Admin-configurable thresholds (overrides FRAUD_DEFAULTS)
    settings: null,       // null = use defaults from config.js

    // Audit log cache (loaded from Firestore)
    auditLogs: [],

    _hydrated: false,
}

const fraudSlice = createSlice({
    name: 'fraud',
    initialState,
    reducers: {
        hydrateFraud: (state, action) => {
            const data = action.payload || {}
            state.blockedPhones = data.blockedPhones || []
            state.blockedIPs = data.blockedIPs || []
            state.watchlist = data.watchlist || []
            state.trustedPhones = data.trustedPhones || []
            state.settings = data.settings || null
            state._hydrated = true
        },

        // Phone blocklist
        blockPhone: (state, action) => {
            const phone = action.payload
            if (phone && !state.blockedPhones.includes(phone)) {
                state.blockedPhones.push(phone)
                // Remove from trusted if present
                state.trustedPhones = state.trustedPhones.filter(p => p !== phone)
            }
        },
        unblockPhone: (state, action) => {
            state.blockedPhones = state.blockedPhones.filter(p => p !== action.payload)
        },

        // IP blocklist
        blockIP: (state, action) => {
            const ip = action.payload
            if (ip && !state.blockedIPs.includes(ip)) {
                state.blockedIPs.push(ip)
            }
        },
        unblockIP: (state, action) => {
            state.blockedIPs = state.blockedIPs.filter(ip => ip !== action.payload)
        },

        // Watchlist
        addToWatchlist: (state, action) => {
            const entry = action.payload // { phone, reason, addedAt }
            if (!state.watchlist.find(w => w.phone === entry.phone)) {
                state.watchlist.push({
                    phone: entry.phone,
                    reason: entry.reason || '',
                    addedAt: entry.addedAt || new Date().toISOString(),
                })
            }
        },
        removeFromWatchlist: (state, action) => {
            state.watchlist = state.watchlist.filter(w => w.phone !== action.payload)
        },

        // Trusted customers
        trustPhone: (state, action) => {
            const phone = action.payload
            if (phone && !state.trustedPhones.includes(phone)) {
                state.trustedPhones.push(phone)
                // Remove from blocked if present
                state.blockedPhones = state.blockedPhones.filter(p => p !== phone)
            }
        },
        untrustPhone: (state, action) => {
            state.trustedPhones = state.trustedPhones.filter(p => p !== action.payload)
        },

        // Settings
        updateFraudSettings: (state, action) => {
            state.settings = { ...(state.settings || {}), ...action.payload }
        },

        // Audit logs (read-only cache from Firestore)
        setAuditLogs: (state, action) => {
            state.auditLogs = action.payload || []
        },
    },
})

export const {
    hydrateFraud,
    blockPhone,
    unblockPhone,
    blockIP,
    unblockIP,
    addToWatchlist,
    removeFromWatchlist,
    trustPhone,
    untrustPhone,
    updateFraudSettings,
    setAuditLogs,
} = fraudSlice.actions

export default fraudSlice.reducer
