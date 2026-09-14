import { createSlice } from '@reduxjs/toolkit'

export const defaultIntegrationsSettings = {
    telegram: {
        enabled: false,
        botToken: '',
        chatId: '',
        includeCustomerDetails: true,
        includeOrderItems: true,
        includeActionButtons: true,
        notifyOnOrderPlaced: true,
        notifyOnStatusChange: false,
        lastTested: null,
        testStatus: null,
    },
    googleSheets: {
        enabled: false,
        mode: 'webhook', // 'webhook' | 'service_account'
        webhookUrl: '',
        spreadsheetId: '',
        sheetName: 'Orders',
        clientEmail: '',
        privateKey: '',
        autoSyncNewOrders: true,
        lastTested: null,
        testStatus: null,
    },
    syncStats: {
        totalOrdersSynced: 0,
        telegramSuccessCount: 0,
        googleSheetsSuccessCount: 0,
        failedCount: 0,
        lastSyncTime: null,
        lastSyncStatus: null,
        lastError: null,
    },
    syncLogs: [], // [{ id, orderId, service, status, error, timestamp, orderSummary }]
}

const integrationsSlice = createSlice({
    name: 'integrations',
    initialState: defaultIntegrationsSettings,
    reducers: {
        hydrateIntegrations: (state, action) => {
            if (!action.payload) return state
            return {
                ...defaultIntegrationsSettings,
                ...action.payload,
                telegram: {
                    ...defaultIntegrationsSettings.telegram,
                    ...(action.payload.telegram || {}),
                },
                googleSheets: {
                    ...defaultIntegrationsSettings.googleSheets,
                    ...(action.payload.googleSheets || {}),
                },
                syncStats: {
                    ...defaultIntegrationsSettings.syncStats,
                    ...(action.payload.syncStats || {}),
                },
                syncLogs: Array.isArray(action.payload.syncLogs)
                    ? action.payload.syncLogs.slice(0, 100) // keep last 100 logs
                    : state.syncLogs,
            }
        },
        updateTelegramSettings: (state, action) => {
            state.telegram = {
                ...state.telegram,
                ...action.payload,
            }
        },
        updateGoogleSheetsSettings: (state, action) => {
            state.googleSheets = {
                ...state.googleSheets,
                ...action.payload,
            }
        },
        recordSyncLog: (state, action) => {
            const log = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                timestamp: new Date().toISOString(),
                ...action.payload,
            }
            // Prepend new log and keep maximum 100 entries
            state.syncLogs = [log, ...(state.syncLogs || [])].slice(0, 100)

            // Update stats
            if (log.status === 'SUCCESS') {
                state.syncStats.totalOrdersSynced += 1
                if (log.service === 'telegram' || log.service === 'all') {
                    state.syncStats.telegramSuccessCount += 1
                }
                if (log.service === 'google_sheets' || log.service === 'all') {
                    state.syncStats.googleSheetsSuccessCount += 1
                }
                state.syncStats.lastSyncTime = log.timestamp
                state.syncStats.lastSyncStatus = 'SUCCESS'
            } else if (log.status === 'FAILED') {
                state.syncStats.failedCount += 1
                state.syncStats.lastSyncTime = log.timestamp
                state.syncStats.lastSyncStatus = 'FAILED'
                state.syncStats.lastError = log.error || 'Unknown error'
            }
        },
        clearSyncLogs: (state) => {
            state.syncLogs = []
        },
        resetIntegrationsSettings: () => {
            return defaultIntegrationsSettings
        },
    },
})

export const {
    hydrateIntegrations,
    updateTelegramSettings,
    updateGoogleSheetsSettings,
    recordSyncLog,
    clearSyncLogs,
    resetIntegrationsSettings,
} = integrationsSlice.actions

export default integrationsSlice.reducer
